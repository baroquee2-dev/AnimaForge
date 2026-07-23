import { useMemo } from 'react'

import { Chats } from '@lib/state/Chat'

export type ChatListItem = {
    index: number
    key: string
    isLastMessage: boolean
    isGreeting: boolean
}

export const useChatListItems = () => {
    const { chat } = Chats.useChat()

    return useMemo<ChatListItem[]>(
        () =>
            (chat?.messages ?? [])
                .map((item, index) => ({
                    index,
                    key: item.id.toString(),
                    isGreeting: index === 0,
                    isLastMessage: !!chat?.messages && index === chat.messages.length - 1,
                }))
                .reverse(),
        [chat?.messages]
    )
}

export const useChatHistoryMeta = () => {
    const { chat } = Chats.useChat()
    const historyCount = Math.max(0, (chat?.messages?.length ?? 0) - 1)
    const lastMessageIndex = Math.max(0, (chat?.messages?.length ?? 1) - 1)

    return { historyCount, lastMessageIndex }
}
