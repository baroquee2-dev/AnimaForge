import { create } from 'zustand'

type ChatInputTextStoreProps = {
    text: string
    setText: (text: string) => void
    inputFocused: boolean
    setInputFocused: (focused: boolean) => void
}

export const useChatInputTextStore = create<ChatInputTextStoreProps>()((set) => ({
    text: '',
    setText: (text) => set({ text }),
    inputFocused: false,
    setInputFocused: (inputFocused) => set({ inputFocused }),
}))
