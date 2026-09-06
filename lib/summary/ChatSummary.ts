import i18n from '@lib/i18n'
import type { ChatEntry } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'

import { enqueueBackgroundJob, runBackgroundCompletion } from './BackgroundGeneration'
import { formatTurn, getLastNTurns, truncateAtBoundary } from './ChatTurns'

const MAX_SUMMARY_LENGTH = 2_400
const MAX_INPUT_SUMMARY_LENGTH = 1_200
const MAX_SOURCE_LENGTH = 6_000
/** Default number of recent turns to feed into the summarizer when no turn count is given. */
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
${formatTurn(turn, MAX_SOURCE_LENGTH)}
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

export const generateChatSummary = async (
    previousSummary: string,
    messages: ChatEntry[],
    turnCount: number = SUMMARY_EVERY_N_TURNS
) => {
    const turn = getLastNTurns(messages, turnCount)
    if (!turn) return

    const instruction = getSummaryInstruction()
    const input = buildSummaryInput(previousSummary, turn)
    const output = await runBackgroundCompletion({
        system: instruction,
        user: input.replace(instruction, '').trim() || input,
        maxTokens: SUMMARY_GENERATED_LENGTH,
        label: 'chat summary',
    })
    return output ? cleanSummary(output) : undefined
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

    void enqueueBackgroundJob(async () => {
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
    })
}
