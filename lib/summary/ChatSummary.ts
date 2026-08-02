import { SamplerID } from '@lib/constants/SamplerData'
import { buildRequest } from '@lib/engine/API/RequestBuilder'
import { APIManager } from '@lib/engine/API/APIManagerState'
import { SSEFetch } from '@lib/engine/SSEFetch'
import i18n from '@lib/i18n'
import { useAppModeStore } from '@lib/state/AppMode'
import { Instructs } from '@lib/state/Instructs'
import { Logger } from '@lib/state/Logger'
import { SamplersManager } from '@lib/state/SamplerState'
import { getNestedValue } from '@lib/utils/Parsing'

import type { Message } from '@lib/engine/API/ContextBuilder'
import type { APIConfiguration, APIValues } from '@lib/engine/API/APIBuilder.types'
import type { ChatEntry } from '@lib/state/Chat'

const MAX_SUMMARY_LENGTH = 1_200
const MAX_SOURCE_LENGTH = 6_000

const getSummaryInstruction = () => i18n.t('chat.summaryInstruction')

const clip = (value: string, maxLength: number) =>
    value.length > maxLength ? value.slice(0, maxLength) + `\n${i18n.t('chat.summaryTruncated')}` : value

const getLastTurn = (messages: ChatEntry[]) => {
    const assistantIndex = messages.findLastIndex((entry) => {
        const swipe = entry.swipes[entry.swipe_id]?.swipe
        return !entry.is_user && !!swipe?.trim()
    })
    if (assistantIndex < 0) return

    const userIndex = messages.findLastIndex(
        (entry, index) => index < assistantIndex && entry.is_user && !!entry.swipes[entry.swipe_id]?.swipe.trim()
    )
    if (userIndex < 0) return

    const user = messages[userIndex]
    const assistant = messages[assistantIndex]
    return [user, assistant]
}

const formatTurn = (turn: ChatEntry[]) =>
    clip(
        turn
            .map((entry) => `${entry.name}: ${entry.swipes[entry.swipe_id]?.swipe.trim() ?? ''}`)
            .join('\n'),
        MAX_SOURCE_LENGTH
    )

const buildSummaryInput = (previousSummary: string, turn: ChatEntry[]) => {
    const instruction = getSummaryInstruction()
    return `${instruction}

${i18n.t('chat.summaryCurrentLabel')}:
<previous_summary>
${clip(previousSummary.trim() || i18n.t('chat.summaryEmpty'), MAX_SUMMARY_LENGTH)}
</previous_summary>

${i18n.t('chat.summaryTurnLabel')}:
<current_turn>
${formatTurn(turn)}
</current_turn>

${i18n.t('chat.summaryOutputLabel')}`
}

const cleanSummary = (summary: string) => {
    return clip(
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

const generateRemoteSummary = async (input: string) => {
    const fields = getRemoteFields()
    if (!fields) {
        Logger.warn('Skipping chat summary because the active connection is unavailable')
        return
    }
    const { config, values, instruct } = fields
    if (config.request.requestType !== 'stream') {
        Logger.warn(`Skipping chat summary because ${config.name} does not support streaming summaries`)
        return
    }

    const summaryConfig: APIConfiguration = {
        ...config,
        request: { ...config.request, useStop: false },
    }
    const prompt = buildPrompt(summaryConfig, input)
    const samplers = {
        ...SamplersManager.getCurrentSampler(),
        [SamplerID.GENERATED_LENGTH]: 384,
        [SamplerID.TEMPERATURE]: 0.2,
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

    return await new Promise<string>((resolve) => {
        let output = ''
        const sse = new SSEFetch()
        const finish = () => resolve(cleanSummary(output))

        sse.setOnEvent((event) => {
            try {
                const content = getNestedValue(JSON.parse(event), config.request.responseParsePattern)
                if (typeof content === 'string') output += content
            } catch {
                // Some providers send non-JSON keepalive events.
            }
        })
        sse.setOnClose(finish)
        sse.setOnError(finish)
        sse.start({
            endpoint: values.endpoint,
            body: typeof payload === 'string' ? payload : JSON.stringify(payload),
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                ...getHeaders(config, values),
            },
        })
    })
}

export const generateChatSummary = async (previousSummary: string, messages: ChatEntry[]) => {
    const turn = getLastTurn(messages)
    if (!turn) return

    const input = buildSummaryInput(previousSummary, turn)
    try {
        let output: string | undefined
        if (useAppModeStore.getState().appMode === 'local') {
            const { generateLocalSummary } = await import('@lib/engine/LocalInference')
            output = await generateLocalSummary(input)
        } else {
            output = await generateRemoteSummary(input)
        }
        return output ? cleanSummary(output) : undefined
    } catch (error) {
        Logger.warn(`Failed to generate chat summary: ${error}`)
        return
    }
}
