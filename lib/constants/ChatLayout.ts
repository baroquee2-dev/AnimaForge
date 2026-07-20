import { useMMKVString } from 'react-native-mmkv'

import { mmkv } from '@lib/storage/MMKV'

/** Add future layouts here, e.g. 'theater' | 'compact' */
export type ChatLayout = 'visualNovel' | 'messenger'

export type MessagePresentation = 'visualNovel' | 'messenger'

export type ChatLayoutCapabilities = {
    messagePresentation: MessagePresentation
    /** Large portrait above dialogue (Visual Novel). */
    showPortrait: boolean
    /** When true, default view shows only the latest message. */
    collapseToLastMessage: boolean
    /** Floating history toggle for collapsed + expandable transcript. */
    supportsHistoryBar: boolean
    /** Settings toggles that apply to this layout. */
    supportsWideChat: boolean
    supportsAlternateAlignment: boolean
    supportsScrollPersistence: boolean
}

export type ChatLayoutDefinition = {
    value: ChatLayout
    label: string
    description: string
    capabilities: ChatLayoutCapabilities
}

export const CHAT_LAYOUT_STORAGE_KEY = 'settings-chat-layout'
const LEGACY_IMMERSIVE_STORAGE_KEY = 'settings-immersive-chat-mode'

export const DEFAULT_CHAT_LAYOUT: ChatLayout = 'visualNovel'

export const CHAT_LAYOUT_DEFINITIONS: Record<ChatLayout, ChatLayoutDefinition> = {
    visualNovel: {
        value: 'visualNovel',
        label: 'Visual Novel',
        description: 'Large portrait with a dialogue box for the latest reply.',
        capabilities: {
            messagePresentation: 'visualNovel',
            showPortrait: true,
            collapseToLastMessage: true,
            supportsHistoryBar: true,
            supportsWideChat: false,
            supportsAlternateAlignment: false,
            supportsScrollPersistence: false,
        },
    },
    messenger: {
        value: 'messenger',
        label: 'Messenger',
        description: 'Standard scrollable chat list with message bubbles.',
        capabilities: {
            messagePresentation: 'messenger',
            showPortrait: false,
            collapseToLastMessage: false,
            supportsHistoryBar: false,
            supportsWideChat: true,
            supportsAlternateAlignment: true,
            supportsScrollPersistence: true,
        },
    },
}

export const CHAT_LAYOUT_OPTIONS = Object.values(CHAT_LAYOUT_DEFINITIONS)

export const isChatLayout = (value?: string | null): value is ChatLayout =>
    value != null && value in CHAT_LAYOUT_DEFINITIONS

export const normalizeChatLayout = (value?: string | null): ChatLayout => {
    if (isChatLayout(value)) return value
    return DEFAULT_CHAT_LAYOUT
}

export const getChatLayoutDefinition = (layout: ChatLayout) => CHAT_LAYOUT_DEFINITIONS[layout]

export const getChatLayoutCapabilities = (layout: ChatLayout) =>
    getChatLayoutDefinition(layout).capabilities

/** @deprecated Use getChatLayoutCapabilities(layout).messagePresentation === 'visualNovel' */
export const isVisualNovelLayout = (layout: ChatLayout) => layout === 'visualNovel'

export const migrateChatLayoutSetting = () => {
    const stored = mmkv.getString(CHAT_LAYOUT_STORAGE_KEY)
    if (isChatLayout(stored)) return

    const legacyImmersive = mmkv.getBoolean(LEGACY_IMMERSIVE_STORAGE_KEY)
    if (legacyImmersive === true) {
        mmkv.set(CHAT_LAYOUT_STORAGE_KEY, 'visualNovel')
    } else if (legacyImmersive === false) {
        mmkv.set(CHAT_LAYOUT_STORAGE_KEY, 'messenger')
    } else {
        mmkv.set(CHAT_LAYOUT_STORAGE_KEY, DEFAULT_CHAT_LAYOUT)
    }
}

export const useChatLayout = () => {
    const [rawLayout, setRawLayout] = useMMKVString(CHAT_LAYOUT_STORAGE_KEY)
    const layout = normalizeChatLayout(rawLayout)

    return {
        layout,
        definition: getChatLayoutDefinition(layout),
        capabilities: getChatLayoutCapabilities(layout),
        setLayout: (next: ChatLayout) => setRawLayout(next),
    }
}
