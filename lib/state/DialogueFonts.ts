import { create } from 'zustand'

type DialogueFontsState = {
    ready: boolean
    setReady: (ready: boolean) => void
}

export const useDialogueFontsStore = create<DialogueFontsState>((set) => ({
    ready: false,
    setReady: (ready) => set({ ready }),
}))
