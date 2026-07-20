import { useMMKVString } from 'react-native-mmkv'

import { mmkv } from '@lib/storage/MMKV'

export type ChatLayout = 'visualNovel' | 'messenger'

export const CHAT_LAYOUT_STORAGE_KEY = 'settings-chat-layout'
const LEGACY_IMMERSIVE_STORAGE_KEY = 'settings-immersive-chat-mode'

export const DEFAULT_CHAT_LAYOUT: ChatLayout = 'visualNovel'

export const CHAT_LAYOUT_OPTIONS: { value: ChatLayout; label: string }[] = [
    { value: 'visualNovel', label: 'Visual Novel' },
    { value: 'messenger', label: 'Messenger' },
]

export const isVisualNovelLayout = (layout: ChatLayout) => layout === 'visualNovel'

export const normalizeChatLayout = (value?: string | null): ChatLayout => {
    if (value === 'visualNovel' || value === 'messenger') return value
    return DEFAULT_CHAT_LAYOUT
}

export const migrateChatLayoutSetting = () => {
    const stored = mmkv.getString(CHAT_LAYOUT_STORAGE_KEY)
    if (stored === 'visualNovel' || stored === 'messenger') return

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
        setLayout: (next: ChatLayout) => setRawLayout(next),
    }
}
