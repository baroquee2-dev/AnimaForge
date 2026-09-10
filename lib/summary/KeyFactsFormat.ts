import i18n from '@lib/i18n'
import { CHAT_KEY_FACT_CATEGORIES, ChatKeyFactCategory, ChatKeyFactType } from 'db/schema'

/** Ceiling on the injected block so facts cannot crowd out the summary. */
const MAX_CONTEXT_FACTS_LENGTH = 1_600

export const getCategoryLabel = (category: ChatKeyFactCategory) =>
    i18n.t(`keyFacts.category.${category}`)

/**
 * Render active facts for prompt injection. Stale facts are kept in the table
 * for the user but left out of the prompt so they cannot contradict the
 * current state.
 */
export const formatKeyFactsForContext = (facts?: ChatKeyFactType[]) => {
    if (!facts?.length) return ''
    const active = facts.filter((fact) => !fact.stale)
    if (active.length === 0) return ''

    const grouped = CHAT_KEY_FACT_CATEGORIES.map((category) => {
        const rows = active.filter((fact) => fact.category === category)
        if (rows.length === 0) return ''
        const lines = rows.map((fact) => `- ${fact.key}: ${fact.value}`).join('\n')
        return `${getCategoryLabel(category)}:\n${lines}`
    })
        .filter(Boolean)
        .join('\n')

    if (!grouped) return ''
    return `\n\n<key_facts>\n${i18n.t('keyFacts.contextIntro')}\n${grouped.slice(
        0,
        MAX_CONTEXT_FACTS_LENGTH
    )}\n</key_facts>`
}
