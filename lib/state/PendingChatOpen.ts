import { create } from 'zustand'

type PendingChatOpenStateProps = {
    characterId?: number
    request: (characterId: number) => void
    clear: () => void
}

/**
 * Hand-off for "open this character's chat once I am gone", used by the
 * character editor when saving. The editor only pops itself; the screen that
 * gains focus pushes the chat. Replacing the editor with ChatScreen instead
 * crashed react-native-screens ("ScreenStackFragment added into a non-stack
 * container") because the header updated mid swap.
 */
export const usePendingChatOpen = create<PendingChatOpenStateProps>()((set) => ({
    characterId: undefined,
    request: (characterId) => set({ characterId }),
    clear: () => set({ characterId: undefined }),
}))
