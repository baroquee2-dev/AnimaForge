import { createContext, useContext, type ReactNode } from 'react'

import {
    type ChatLayout,
    type ChatLayoutCapabilities,
    type ChatLayoutDefinition,
    getChatLayoutDefinition,
} from '@lib/constants/ChatLayout'

type ChatLayoutContextValue = {
    layout: ChatLayout
    definition: ChatLayoutDefinition
    capabilities: ChatLayoutCapabilities
}

const ChatLayoutContext = createContext<ChatLayoutContextValue | null>(null)

type ChatLayoutProviderProps = {
    layout: ChatLayout
    children: ReactNode
}

export const ChatLayoutProvider = ({ layout, children }: ChatLayoutProviderProps) => {
    const definition = getChatLayoutDefinition(layout)

    return (
        <ChatLayoutContext.Provider
            value={{ layout, definition, capabilities: definition.capabilities }}>
            {children}
        </ChatLayoutContext.Provider>
    )
}

export const useChatLayoutContext = () => {
    const value = useContext(ChatLayoutContext)
    if (!value) {
        throw new Error('useChatLayoutContext must be used within ChatLayoutProvider')
    }
    return value
}

export const useMessagePresentation = () =>
    useChatLayoutContext().capabilities.messagePresentation

export const useIsVisualNovelPresentation = () => useMessagePresentation() === 'visualNovel'

export const useChatLayoutCapabilities = () => useChatLayoutContext().capabilities
