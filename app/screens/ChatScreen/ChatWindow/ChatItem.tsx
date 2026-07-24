import { StyleSheet, View } from 'react-native'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useLiveQueryJoined } from '@lib/hooks/LiveQueryJoined'
import { useQueuedLiveQuery } from '@lib/hooks/LiveQueryQueued'
import { ChatEntry, Chats, useInference } from '@lib/state/Chat'

import { useIsImmersivePresentation, useIsVisualNovelPresentation } from '@lib/chat/ChatLayoutContext'
import ChatBubble from './ChatBubble'
import ChatFrame from './ChatFrame'
import ChatFrameSkeleton from './ChatFrameSkeleton'

type ChatItemProps = {
    index: number
    entryId: number
    tokenLength: number
    isLastMessage: boolean
    isGreeting: boolean
    historyCompact?: boolean
    portraitExternal?: boolean
    toolbarExternal?: boolean
}

const ChatItem: React.FC<ChatItemProps> = ({
    index,
    entryId,
    tokenLength,
    isLastMessage,
    isGreeting,
    historyCompact = false,
    portraitExternal = false,
    toolbarExternal = false,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    const isVisualNovel = useIsVisualNovelPresentation()
    const isImmersive = useIsImmersivePresentation()

    const cachedEntry = Chats.useChatState(
        useShallow((state) => state.data?.messages?.find((item) => item.id === entryId))
    )

    const entryQuery = useMemo(() => Chats.db.live.entry(entryId), [entryId])
    const swipeListQuery = useMemo(() => Chats.db.live.swipeIdList(entryId), [entryId])

    const { data: swipeIdList } = useLiveQueryJoined(swipeListQuery, [entryId], {
        deepCheck: true,
        sync: true,
    })

    const swipeRowIds = swipeIdList?.map((item) => item.id) ?? []
    const liveQueryOptions = useMemo(
        () => ({
            targets: [
                { tableName: 'chat_entries' as const, rowId: entryId },
                { tableName: 'chat_swipes' as const, rowId: swipeRowIds },
            ],
            sync: true as const,
        }),
        [entryId, swipeRowIds.join(',')]
    )

    const { data: liveEntry } = useQueuedLiveQuery(entryQuery, [entryId], liveQueryOptions)

    const entry: ChatEntry | undefined = liveEntry
        ? Chats.mapLiveEntryToChatEntry(liveEntry)
        : cachedEntry
    const entryReady =
        !!entry &&
        entry.swipes.length > 0 &&
        entry.swipes[entry.swipe_id] !== undefined
    const estimatedHeight = Math.max(48, (tokenLength / 10) * 16 + 32)

    return (
        <View
            style={[
                styles.chatItem,
                { zIndex: index },
                (isVisualNovel || isImmersive) && isLastMessage && styles.presentationLastItem,
                historyCompact && styles.historyCompactItem,
            ]}>
            {entryReady ? (
                <ChatFrame
                    index={index}
                    entry={entry}
                    nowGenerating={nowGenerating}
                    isLast={isLastMessage}
                    historyCompact={historyCompact}
                    portraitExternal={portraitExternal}>
                    <ChatBubble
                        entry={entry}
                        nowGenerating={nowGenerating}
                        index={index}
                        isLastMessage={isLastMessage}
                        isGreeting={isGreeting}
                        historyCompact={historyCompact}
                        toolbarExternal={toolbarExternal}
                    />
                </ChatFrame>
            ) : (
                <ChatFrameSkeleton
                    index={index}
                    isLastMessage={isLastMessage}
                    estimatedHeight={estimatedHeight}
                    historyCompact={historyCompact}
                    portraitExternal={portraitExternal}
                />
            )}
        </View>
    )
}

export default ChatItem

const styles = StyleSheet.create({
    chatItem: {
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    presentationLastItem: {
        paddingHorizontal: 0,
        marginBottom: 0,
    },
    historyCompactItem: {
        opacity: 0.75,
        marginBottom: 2,
    },
})
