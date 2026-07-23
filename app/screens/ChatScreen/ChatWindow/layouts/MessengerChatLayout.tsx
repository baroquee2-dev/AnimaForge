import { useEffect, useRef } from 'react'
import { FlatList } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

import { AppSettings } from '@lib/constants/GlobalValues'
import { useDebounce } from '@lib/hooks/Debounce'
import { Chats } from '@lib/state/Chat'
import { useShallow } from 'zustand/react/shallow'

import { useInputHeightStore } from '../../ChatInput'
import ChatFooter from '../ChatFooter'
import ChatItem from '../ChatItem'
import { useChatActionsState } from '../ChatQuickActions'
import { useChatListItems } from '@lib/chat/useChatListItems'

const MessengerChatLayout = () => {
    const { chat } = Chats.useChat()
    const [saveScroll] = useMMKVBoolean(AppSettings.SaveScrollPosition)
    const [autoScroll] = useMMKVBoolean(AppSettings.AutoScroll)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const list = useChatListItems()
    const { cause: scrollCause, index: scrollIndex } = chat?.autoScroll ?? {}
    const flatlistRef = useRef<FlatList | null>(null)

    const updateScrollPosition = useDebounce((position: number, chatId: number) => {
        if (chatId) {
            Chats.db.mutate.updateScrollOffset(chatId, position)
        }
    }, 200)

    useEffect(() => {
        if (!scrollCause || !scrollIndex) return
        const isSave = scrollCause === 'saveScroll'
        if (!saveScroll && isSave) return
        const offset = Math.max(0, scrollIndex + (isSave ? 1 : 0))

        if (offset > 2)
            flatlistRef.current?.scrollToIndex({
                index: offset,
                animated: scrollCause === 'search',
                viewOffset: 32,
            })
    }, [scrollCause, scrollIndex, saveScroll])

    const renderItems = ({ item }: { item: (typeof list)[number] }) => (
        <ChatItem
            index={item.index}
            isLastMessage={item.isLastMessage}
            isGreeting={item.isGreeting}
        />
    )

    return (
        <FlatList
            CellRendererComponent={(props: any) => (
                <Animated.View
                    {...props}
                    layout={LinearTransition.duration(250)
                        .springify()
                        .mass(0.3)
                        .damping(20)
                        .stiffness(300)}
                    exiting={FadeOut.duration(150)}
                    entering={FadeIn.duration(150).delay(100)}
                />
            )}
            ref={flatlistRef}
            maintainVisibleContentPosition={
                autoScroll ? null : { minIndexForVisible: 1, autoscrollToTopThreshold: 50 }
            }
            keyboardShouldPersistTaps="handled"
            inverted
            data={list}
            keyExtractor={(item) => item.key}
            renderItem={renderItems}
            onScrollBeginDrag={() => {
                useChatActionsState.getState().setActiveIndex(undefined)
            }}
            scrollEventThrottle={16}
            onViewableItemsChanged={(item) => {
                const index = item.viewableItems?.at(0)?.index

                if (index && chat?.id)
                    updateScrollPosition(
                        index - (item.viewableItems.length === 1 ? 1 : 0),
                        chat.id
                    )
            }}
            onScrollToIndexFailed={(error) => {
                flatlistRef.current?.scrollToOffset({
                    offset: error.averageItemLength * error.index,
                    animated: true,
                })
                setTimeout(() => {
                    if (list.length !== 0 && flatlistRef.current !== null) {
                        flatlistRef.current?.scrollToIndex({
                            index: error.index,
                            animated: true,
                            viewOffset: 32,
                        })
                    }
                }, 100)
            }}
            contentContainerStyle={{
                paddingTop: chatInputHeight,
                paddingBottom: 32,
                rowGap: 8,
            }}
            ListFooterComponent={() => <ChatFooter />}
        />
    )
}

export default MessengerChatLayout
