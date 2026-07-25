import { useMMKVString } from 'react-native-mmkv'

import { mmkv } from '@lib/storage/MMKV'

export type ChatLayout = 'visualNovel' | 'messenger' | 'immersive'

export type MessagePresentation = 'visualNovel' | 'messenger' | 'immersive'

export type ChatLayoutCapabilities = {
    messagePresentation: MessagePresentation
    /** Large portrait above dialogue (Visual Novel). */
    showPortrait: boolean
    /** Character art fills the chat window (Immersive). */
    fullScreenPortrait: boolean
    /** Whether chat/scene background images are shown behind messages. */
    showChatBackground: boolean
    /** Dialogue and input surfaces use high transparency. */
    transparentChrome: boolean
    /** When true, default view shows only the latest message. */
    collapseToLastMessage: boolean
    /** Floating history toggle for collapsed + expandable transcript. */
    supportsHistoryBar: boolean
    /** Settings toggles that apply to this layout. */
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
            fullScreenPortrait: false,
            showChatBackground: true,
            transparentChrome: false,
            collapseToLastMessage: true,
            supportsHistoryBar: true,
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
            fullScreenPortrait: false,
            showChatBackground: true,
            transparentChrome: false,
            collapseToLastMessage: false,
            supportsHistoryBar: false,
            supportsScrollPersistence: true,
        },
    },
    immersive: {
        value: 'immersive',
        label: 'Immersive',
        description: 'Full-screen character portrait. Dialogue and input use transparent overlays.',
        capabilities: {
            messagePresentation: 'immersive',
            showPortrait: true,
            fullScreenPortrait: true,
            showChatBackground: false,
            transparentChrome: true,
            collapseToLastMessage: true,
            supportsHistoryBar: true,
            supportsScrollPersistence: false,
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

export const migrateChatLayoutSetting = () => {
    const stored = mmkv.getString(CHAT_LAYOUT_STORAGE_KEY)
    if (isChatLayout(stored)) return

    if (mmkv.contains(LEGACY_IMMERSIVE_STORAGE_KEY)) {
        const legacyImmersive = mmkv.getBoolean(LEGACY_IMMERSIVE_STORAGE_KEY)
        mmkv.set(CHAT_LAYOUT_STORAGE_KEY, legacyImmersive ? 'visualNovel' : 'messenger')
        return
    }

    mmkv.set(CHAT_LAYOUT_STORAGE_KEY, DEFAULT_CHAT_LAYOUT)
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
