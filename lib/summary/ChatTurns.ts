import i18n from '@lib/i18n'
import type { ChatEntry } from '@lib/state/Chat'

export const getEntryText = (entry: ChatEntry) => entry.swipes[entry.swipe_id]?.swipe?.trim() ?? ''

/**
 * Truncate text at a natural boundary without adding a truncation marker.
 * Used for stored text so that future passes are not confused by an injected
 * "[truncated]" token.
 */
export const truncateAtBoundary = (value: string, maxLength: number): string => {
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
export const getLastNTurns = (messages: ChatEntry[], turnCount: number) => {
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

export const formatTurn = (turn: ChatEntry[], maxLength: number) => {
    const text = turn.map((entry) => `${entry.name}: ${getEntryText(entry)}`).join('\n')
    return text.length > maxLength
        ? text.slice(0, maxLength) + `\n${i18n.t('chat.summaryTruncated')}`
        : text
}
