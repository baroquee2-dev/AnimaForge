import { create } from 'zustand'

type PendingChatOpenStateProps = {
    characterId?: number
    request: (characterId: number) => void
    clear: () => void
}

/** Editor → list hand-off so a new character's chat is pushed after the editor pops. */
export const usePendingChatOpen = create<PendingChatOpenStateProps>()((set) => ({
    characterId: undefined,
    request: (characterId) => set({ characterId }),
    clear: () => set({ characterId: undefined }),
}))
