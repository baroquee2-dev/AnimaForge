import { useMemo } from 'react'

import { useLiveQueryJoined } from '@lib/hooks/LiveQueryJoined'
import { Chats } from '@lib/state/Chat'

export type ChatListItem = {
    index: number
    entryId: number
    key: string
    tokenLength: number
    isLastMessage: boolean
    isGreeting: boolean
}

export const useChatListItems = () => {
    const { chatId, chat } = Chats.useChat()
    const entryListQuery = useMemo(
        () => Chats.db.live.entryIdList(chatId ?? -1),
        [chatId]
    )
    const { data: entryRows } = useLiveQueryJoined(entryListQuery, [chatId], { sync: true })

    return useMemo<ChatListItem[]>(() => {
        const rows =
            entryRows && entryRows.length > 0
                ? entryRows
                : (chat?.messages ?? []).map((item) => ({
                      id: item.id,
                      swipe_id: item.swipe_id,
                      swipes: item.swipes.map((swipe) => ({ swipe: swipe.swipe })),
                  }))

        const len = rows.length
        return rows.map((item, listIndex) => {
            const index = len - listIndex - 1
            const activeSwipe = item.swipes?.[item.swipe_id]
            return {
                index,
                entryId: item.id,
                key: item.id.toString(),
                tokenLength: activeSwipe?.swipe?.length ?? 0,
                isGreeting: listIndex === len - 1,
                isLastMessage: listIndex === 0,
            }
        })
    }, [chat?.messages, entryRows])
}

export const useChatHistoryMeta = (listOverride?: ChatListItem[]) => {
    const list = listOverride ?? useChatListItems()
    const historyCount = Math.max(0, list.length - 1)
    const lastItem = list.find((item) => item.isLastMessage)
    const lastMessageIndex = lastItem?.index ?? 0

    return { historyCount, lastMessageIndex, lastItem }
}
