import i18n from '@lib/i18n'
import type { ChatEntry } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { CHAT_KEY_FACT_CATEGORIES, ChatKeyFactCategory, ChatKeyFactType } from 'db/schema'

import { enqueueBackgroundJob, runBackgroundCompletion } from './BackgroundGeneration'
import { formatTurn, getLastNTurns } from './ChatTurns'

const MAX_SOURCE_LENGTH = 6_000
const MAX_KNOWN_FACTS_LENGTH = 2_400
const MAX_KEY_LENGTH = 40
const MAX_VALUE_LENGTH = 240
const MAX_NOTE_LENGTH = 200
const KEY_FACTS_GENERATED_LENGTH = 1_024
/** Ceiling on rows kept per chat. Oldest stale facts are dropped first. */
export const MAX_KEY_FACTS_PER_CHAT = 60

export type KeyFactOp = {
    op: 'add' | 'update' | 'stale'
    category: ChatKeyFactCategory
    key: string
    value: string
    note: string
}

const isCategory = (value: unknown): value is ChatKeyFactCategory =>
    typeof value === 'string' && (CHAT_KEY_FACT_CATEGORIES as readonly string[]).includes(value)

const formatKnownFacts = (facts: ChatKeyFactType[]) => {
    if (facts.length === 0) return i18n.t('keyFacts.none')
    const lines = facts.map((fact) => {
        const status = fact.stale ? ` ${i18n.t('keyFacts.staleMarker')}` : ''
        return `[${fact.category}] ${fact.key} = ${fact.value}${status}`
    })
    const text = lines.join('\n')
    return text.length > MAX_KNOWN_FACTS_LENGTH
        ? `${text.slice(0, MAX_KNOWN_FACTS_LENGTH)}\n${i18n.t('chat.summaryTruncated')}`
        : text
}

const buildKeyFactsInput = (facts: ChatKeyFactType[], turn: ChatEntry[]) => {
    return `${i18n.t('keyFacts.knownLabel')}:
<known_facts>
${formatKnownFacts(facts)}
</known_facts>

${i18n.t('keyFacts.turnLabel')}:
<current_turn>
${formatTurn(turn, MAX_SOURCE_LENGTH)}
</current_turn>

${i18n.t('keyFacts.outputLabel')}`
}

/**
 * Models wrap JSON in prose or code fences often enough that a plain
 * JSON.parse of the whole completion is not worth attempting.
 */
const parseKeyFactOps = (raw: string): KeyFactOp[] => {
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end <= start) {
        Logger.warn('Key fact extraction returned no JSON array')
        return []
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(raw.slice(start, end + 1))
    } catch (error) {
        Logger.warn(`Key fact extraction returned invalid JSON: ${error}`)
        return []
    }
    if (!Array.isArray(parsed)) return []

    const ops: KeyFactOp[] = []
    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') continue
        const candidate = entry as Record<string, unknown>
        const op = candidate.op
        const key = typeof candidate.key === 'string' ? candidate.key.trim() : ''
        if (!key) continue
        if (op !== 'add' && op !== 'update' && op !== 'stale') continue

        const value = typeof candidate.value === 'string' ? candidate.value.trim() : ''
        // `stale` only flags an existing row, so it is the one op that needs no value.
        if (op !== 'stale' && !value) continue

        ops.push({
            op: op,
            category: isCategory(candidate.category) ? candidate.category : 'identity',
            key: key.slice(0, MAX_KEY_LENGTH),
            value: value.slice(0, MAX_VALUE_LENGTH),
            note:
                typeof candidate.note === 'string'
                    ? candidate.note.trim().slice(0, MAX_NOTE_LENGTH)
                    : '',
        })
    }
    return ops
}

export const generateKeyFactOps = async (
    facts: ChatKeyFactType[],
    messages: ChatEntry[],
    turnCount: number
) => {
    const turn = getLastNTurns(messages, turnCount)
    if (!turn) return []

    const output = await runBackgroundCompletion({
        system: i18n.t('keyFacts.instruction'),
        user: buildKeyFactsInput(facts, turn),
        maxTokens: KEY_FACTS_GENERATED_LENGTH,
        label: 'key fact extraction',
    })
    return output ? parseKeyFactOps(output) : []
}

type KeyFactsPersist = (chatId: number, ops: KeyFactOp[]) => Promise<ChatKeyFactType[] | undefined>

let keyFactJobSeq = 0
const activeKeyFactJobs = new Map<number, number>()

/** Background key-fact extraction with per-chat race protection. */
export const scheduleKeyFactsUpdate = (params: {
    chatId: number
    facts: ChatKeyFactType[]
    messages: ChatEntry[]
    turnCount: number
    persist: KeyFactsPersist
    onApplied?: (chatId: number, facts: ChatKeyFactType[]) => void
}) => {
    const { chatId, facts, messages, turnCount, persist, onApplied } = params
    const jobId = ++keyFactJobSeq
    activeKeyFactJobs.set(chatId, jobId)

    void enqueueBackgroundJob(async () => {
        try {
            Logger.info(`Extracting key facts for chat ${chatId} (${turnCount} turns)`)
            const ops = await generateKeyFactOps(facts, messages, turnCount)
            if (ops.length === 0) return
            if (activeKeyFactJobs.get(chatId) !== jobId) {
                Logger.debug(`Discarding superseded key fact job for chat ${chatId}`)
                return
            }
            const updated = await persist(chatId, ops)
            if (!updated || activeKeyFactJobs.get(chatId) !== jobId) return
            Logger.info(`Applied ${ops.length} key fact changes to chat ${chatId}`)
            onApplied?.(chatId, updated)
        } catch (error) {
            Logger.warn(`Failed to schedule key fact extraction: ${error}`)
        } finally {
            if (activeKeyFactJobs.get(chatId) === jobId) {
                activeKeyFactJobs.delete(chatId)
            }
        }
    })
}
