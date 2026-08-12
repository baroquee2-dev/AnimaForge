import { fetch } from 'expo/fetch'

import { SamplerID } from '@lib/constants/SamplerData'
import type { APIConfiguration, APIValues } from '@lib/engine/API/APIBuilder.types'
import { APIManager } from '@lib/engine/API/APIManagerState'
import type { Message } from '@lib/engine/API/ContextBuilder'
import { buildRequest } from '@lib/engine/API/RequestBuilder'
import i18n from '@lib/i18n'
import { useAppModeStore } from '@lib/state/AppMode'
import type { ChatEntry } from '@lib/state/Chat'
import { Instructs } from '@lib/state/Instructs'
import { Logger } from '@lib/state/Logger'
import { SamplersManager } from '@lib/state/SamplerState'
import { getNestedValue } from '@lib/utils/Parsing'

const MAX_SUMMARY_LENGTH = 2_400
const MAX_INPUT_SUMMARY_LENGTH = 1_200
const MAX_SOURCE_LENGTH = 6_000
/** How many user→assistant turns between automatic summary updates. */
export const SUMMARY_EVERY_N_TURNS = 20
/**
 * Generation budget for summary requests. The prompt asks for ~600 CJK
 * words across two sections, which can need well over 384 tokens depending
 * on tokenizer. Too small a budget can also starve the final answer on
 * reasoning models that spend part of it on hidden reasoning, which surfaces
 * as an "empty completion" rather than a truncated one.
 */
const SUMMARY_GENERATED_LENGTH = 1_024

type SummaryPersist = (chatId: number, summary: string, updatedAt: number) => Promise<void>

let summaryJobSeq = 0
const activeSummaryJobs = new Map<number, number>()

const getSummaryInstruction = () => i18n.t('chat.summaryInstruction')

const clip = (value: string, maxLength: number) =>
    value.length > maxLength
        ? value.slice(0, maxLength) + `\n${i18n.t('chat.summaryTruncated')}`
        : value

/**
 * Truncate text at a natural boundary without adding a truncation marker.
 * Used for stored summaries so that future summary passes are not confused
 * by an injected "[truncated]" token.
 */
const truncateAtBoundary = (value: string, maxLength: number): string => {
    if (value.length <= maxLength) return value

    const truncated = value.slice(0, maxLength)
    const lastBoundary = Math.max(
        truncated.lastIndexOf('。'),
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('！'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('？'),
        truncated.lastIndexOf('?'),
        truncated.lastIndexOf('\n')
    )
    if (lastBoundary > maxLength * 0.7) return truncated.slice(0, lastBoundary + 1).trim()
    return truncated.trim()
}

const getEntryText = (entry: ChatEntry) => entry.swipes[entry.swipe_id]?.swipe?.trim() ?? ''

const findPreviousAssistantIndex = (messages: ChatEntry[], beforeIndex: number) => {
    for (let i = beforeIndex - 1; i >= 0; i--) {
        if (!messages[i].is_user && !!getEntryText(messages[i])) return i
    }
    return -1
}

/**
 * Indexes of assistant messages that complete a user→assistant turn.
 */
const getUserAssistantTurnEnds = (messages: ChatEntry[]) => {
    const ends: number[] = []
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].is_user || !getEntryText(messages[i])) continue
        const previousAssistantIndex = findPreviousAssistantIndex(messages, i)
        const hasUser = messages
            .slice(previousAssistantIndex + 1, i)
            .some((entry) => entry.is_user && !!getEntryText(entry))
        if (hasUser) ends.push(i)
    }
    return ends
}

/**
 * Collect up to N user→assistant turns from the end of the chat
 * (everything after the assistant before the first selected turn).
 */
const getLastNTurns = (messages: ChatEntry[], turnCount: number) => {
    if (turnCount <= 0) return

    const ends = getUserAssistantTurnEnds(messages)
    if (ends.length === 0) return

    const selectedEnds = ends.slice(-turnCount)
    const firstEnd = selectedEnds[0]
    const previousAssistantIndex = findPreviousAssistantIndex(messages, firstEnd)
    const lastEnd = selectedEnds[selectedEnds.length - 1]

    const window = messages
        .slice(previousAssistantIndex + 1, lastEnd + 1)
        .filter((entry) => !!getEntryText(entry))

    return window.length > 0 ? window : undefined
}

const formatTurn = (turn: ChatEntry[]) =>
    clip(turn.map((entry) => `${entry.name}: ${getEntryText(entry)}`).join('\n'), MAX_SOURCE_LENGTH)

const buildSummaryInput = (previousSummary: string, turn: ChatEntry[]) => {
    const instruction = getSummaryInstruction()
    const trimmedSummary = previousSummary.trim() || i18n.t('chat.summaryEmpty')
    const wasClipped = trimmedSummary.length > MAX_INPUT_SUMMARY_LENGTH
    const summarySection = wasClipped
        ? `${trimmedSummary.slice(0, MAX_INPUT_SUMMARY_LENGTH)}\n${i18n.t('chat.summaryTruncated')}`
        : trimmedSummary

    return `${instruction}

${i18n.t('chat.summaryCurrentLabel')}:
<previous_summary>
${summarySection}
</previous_summary>

${i18n.t('chat.summaryTurnLabel')}:
<current_turn>
${formatTurn(turn)}
</current_turn>

${i18n.t('chat.summaryOutputLabel')}`
}

const cleanSummary = (summary: string) => {
    return truncateAtBoundary(
        summary
            .trim()
            .replace(/^```(?:text|markdown)?\s*/i, '')
            .replace(/```$/i, '')
            .replace(/^(?:摘要|Summary)\s*[：:]\s*/i, '')
            .trim(),
        MAX_SUMMARY_LENGTH
    )
}

const getRemoteFields = () => {
    const connectionState = APIManager.useConnectionsStore.getState()
    const values = connectionState.values[connectionState.activeIndex]
    const config = connectionState.getTemplates().find((item) => item.name === values?.configName)
    const instruct = Instructs.useInstruct.getState().replacedMacros()
    if (!values || !config || !instruct) return
    return { values, config, instruct }
}

const buildPrompt = (config: APIConfiguration, input: string): string | Message[] => {
    const completionType = config.request.completionType
    const instruction = getSummaryInstruction()
    if (completionType.type === 'textCompletions') return input

    return [
        {
            role: completionType.systemRole,
            [completionType.contentName]: instruction,
        },
        {
            role: completionType.userRole,
            [completionType.contentName]: input.replace(instruction, '').trim(),
        },
    ]
}

const getHeaders = (config: APIConfiguration, values: APIValues) => {
    if (!config.features.useKey) return {}
    return { [config.request.authHeader]: config.request.authPrefix + values.key }
}

const disableStream = (payload: unknown) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
    return { ...(payload as Record<string, unknown>), stream: false }
}

const hasProviderError = (data: unknown) => {
    if (!data || typeof data !== 'object') return false
    const root = data as Record<string, any>
    if (root.error != null) return true
    if (Array.isArray(root.errors) && root.errors.length > 0) return true
    if (
        typeof root.message === 'string' &&
        /error|fail|invalid/i.test(root.message) &&
        !root.choices
    )
        return true
    return false
}

const extractCompletionText = (data: unknown, pattern: string | string[]) => {
    if (hasProviderError(data)) return ''

    const nested = getNestedValue(data, pattern)
    if (typeof nested === 'string' && nested.trim()) return nested

    if (!data || typeof data !== 'object') return ''

    const root = data as Record<string, any>
    const candidates = [
        root?.choices?.[0]?.message?.content,
        root?.choices?.[0]?.text,
        root?.content?.[0]?.text,
        root?.content,
        root?.output_text,
        root?.text,
        root?.response,
    ]
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) return candidate
    }
    return ''
}

const generateRemoteSummary = async (input: string) => {
    const fields = getRemoteFields()
    if (!fields) {
        Logger.warn('Skipping chat summary because the active connection is unavailable')
        return
    }
    const { config, values, instruct } = fields
    if (config.request.requestType === 'horde') {
        Logger.warn(
            `Skipping chat summary because ${config.name} (Horde) is not supported for auto summary`
        )
        return
    }

    const summaryConfig: APIConfiguration = {
        ...config,
        request: { ...config.request, useStop: false },
    }
    const prompt = buildPrompt(summaryConfig, input)
    const samplers = {
        ...SamplersManager.getCurrentSampler(),
        [SamplerID.GENERATED_LENGTH]: SUMMARY_GENERATED_LENGTH,
        [SamplerID.TEMPERATURE]: 0.2,
        // Reasoning models otherwise inherit whatever effort the user's active
        // sampler preset has, which can silently consume the entire
        // generated-length budget on hidden reasoning and leave nothing for
        // the actual summary (surfaces as "empty completion").
        [SamplerID.REASONING_EFFORT]: 'disabled' as const,
        [SamplerID.REASONING_MAX_TOKENS]: 0,
        [SamplerID.REASONING_EXCLUDE]: true,
    }
    const payload = await buildRequest({
        apiConfig: summaryConfig,
        apiValues: values,
        samplers,
        instruct: { ...instruct, system_prompt: getSummaryInstruction() },
        prompt,
        stopSequence: [],
    })
    if (!payload) return

    const bodyObject =
        typeof payload === 'string' ? disableStream(JSON.parse(payload)) : disableStream(payload)

    const response = await fetch(values.endpoint, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            ...getHeaders(config, values),
        },
        body: JSON.stringify(bodyObject),
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        Logger.warn(
            `Skipping chat summary because the provider returned ${response.status}${
                errorText ? `: ${errorText.slice(0, 200)}` : ''
            }`
        )
        return
    }

    let data: unknown
    try {
        data = await response.json()
    } catch (error) {
        Logger.warn(`Skipping chat summary because the provider returned invalid JSON: ${error}`)
        return
    }

    if (hasProviderError(data)) {
        Logger.warn(
            `Skipping chat summary because the provider returned an error payload: ${JSON.stringify(
                data
            ).slice(0, 200)}`
        )
        return
    }

    const content = extractCompletionText(data, config.request.responseParsePattern)
    const cleaned = content ? cleanSummary(content) : ''
    if (!cleaned.trim()) {
        Logger.warn('Skipping chat summary because the provider returned an empty completion')
        return
    }
    return cleaned
}

export const generateChatSummary = async (
    previousSummary: string,
    messages: ChatEntry[],
    turnCount: number = SUMMARY_EVERY_N_TURNS
) => {
    const turn = getLastNTurns(messages, turnCount)
    if (!turn) return

    const instruction = getSummaryInstruction()
    const input = buildSummaryInput(previousSummary, turn)
    const userContent = input.replace(instruction, '').trim()
    try {
        let output: string | undefined
        if (useAppModeStore.getState().appMode === 'local') {
            const { generateLocalSummary } = await import('@lib/engine/LocalInference')
            output = await generateLocalSummary(
                {
                    system: instruction,
                    user: userContent || input,
                },
                SUMMARY_GENERATED_LENGTH
            )
        } else {
            output = await generateRemoteSummary(input)
        }
        return output ? cleanSummary(output) : undefined
    } catch (error) {
        Logger.warn(`Failed to generate chat summary: ${error}`)
        return
    }
}

/** Background rolling summary with per-chat race protection. */
export const scheduleChatSummaryUpdate = (params: {
    chatId: number
    previousSummary: string
    messages: ChatEntry[]
    turnCount?: number
    persist: SummaryPersist
    onApplied?: (chatId: number, summary: string, updatedAt: number) => void
}) => {
    const {
        chatId,
        previousSummary,
        messages,
        turnCount = SUMMARY_EVERY_N_TURNS,
        persist,
        onApplied,
    } = params
    const jobId = ++summaryJobSeq
    activeSummaryJobs.set(chatId, jobId)

    void (async () => {
        try {
            Logger.info(`Generating summary for chat ${chatId} (${turnCount} turns)`)
            const summary = await generateChatSummary(previousSummary, messages, turnCount)
            if (!summary?.trim()) return
            if (activeSummaryJobs.get(chatId) !== jobId) {
                Logger.debug(`Discarding superseded summary job for chat ${chatId}`)
                return
            }
            const updatedAt = Date.now()
            await persist(chatId, summary, updatedAt)
            if (activeSummaryJobs.get(chatId) !== jobId) return
            onApplied?.(chatId, summary, updatedAt)
        } catch (error) {
            Logger.warn(`Failed to schedule chat summary: ${error}`)
        } finally {
            if (activeSummaryJobs.get(chatId) === jobId) {
                activeSummaryJobs.delete(chatId)
            }
        }
    })()
}
