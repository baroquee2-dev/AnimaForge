import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useEffect, useRef, useState } from 'react'
import { FlatList } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import Drawer from '@components/views/Drawer'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { useDebounce } from '@lib/hooks/Debounce'
import { useAppMode } from '@lib/state/AppMode'
import { useBackgroundStore } from '@lib/state/BackgroundImage'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { AppDirectory } from '@lib/utils/File'

import { useInputHeightStore } from '../ChatInput'
import AnimatedChatBackground from './AnimatedChatBackground'
import ChatFooter from './ChatFooter'
import ChatHeaderGradient from './ChatHeaderGradient'
import ChatItem from './ChatItem'
import ChatModelName from './ChatModelName'
import { useChatActionsState } from './ChatQuickActions'
import ImmersiveChatLayout from './ImmersiveChatLayout'
import ImmersiveHistoryBar from './ImmersiveHistoryBar'

type ListItem = {
    index: number
    key: string
    isLastMessage: boolean
    isGreeting: boolean
}

const ChatWindow = () => {
    const { chat } = Chats.useChat()
    const charId = Characters.useCharacterStore((state) => state.card?.id)
    const { appMode } = useAppMode()
    const [saveScroll] = useMMKVBoolean(AppSettings.SaveScrollPosition)
    const [showModelname] = useMMKVBoolean(AppSettings.ShowModelInChat)
    const [autoScroll] = useMMKVBoolean(AppSettings.AutoScroll)
    const [immersive] = useMMKVBoolean(AppSettings.ImmersiveChatMode)
    const [historyExpanded, setHistoryExpanded] = useState(false)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const { data: { background_image: backgroundImage } = {} } = useLiveQuery(
        Characters.db.query.backgroundImageQuery(charId ?? -1)
    )
    const { cause: scrollCause, index: scrollIndex } = chat?.autoScroll ?? {}
    const flatlistRef = useRef<FlatList | null>(null)
    const { showSettings, showChat } = Drawer.useDrawerStore(
        useShallow((state) => ({
            showSettings: state.values?.[Drawer.ID.SETTINGS],
            showChat: state.values?.[Drawer.ID.CHATLIST],
        }))
    )

    const updateScrollPosition = useDebounce((position: number, chatId: number) => {
        if (chatId) {
            Chats.db.mutate.updateScrollOffset(chatId, position)
        }
    }, 200)

    const image = useBackgroundStore((state) => state.image)

    const list: ListItem[] = (chat?.messages ?? [])
        .map((item, index) => ({
            index: index,
            key: item.id.toString(),
            isGreeting: index === 0,
            isLastMessage: !!chat?.messages && index === chat?.messages.length - 1,
        }))
        .reverse()

    const historyCount = Math.max(0, (chat?.messages?.length ?? 0) - 1)
    const lastMessage = chat?.messages?.at(-1)
    const lastMessageIndex = Math.max(0, (chat?.messages?.length ?? 1) - 1)
    const immersiveCollapsed = immersive && !historyExpanded
    const showImmersivePortrait =
        immersiveCollapsed && !!lastMessage && !lastMessage.is_user
    const visibleList = immersiveCollapsed ? list.filter((item) => item.isLastMessage) : list
    const collapsedLastItem = visibleList[0]

    useEffect(() => {
        if (!immersive) setHistoryExpanded(false)
    }, [immersive, chat?.id])

    useEffect(() => {
        if (immersive) return
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
    }, [scrollCause, scrollIndex, saveScroll, immersive])

    const renderItems = ({ item }: { item: ListItem }) => {
        const message = chat?.messages?.[item.index]
        return (
            <ChatItem
                index={item.index}
                isLastMessage={item.isLastMessage}
                isGreeting={item.isGreeting}
                immersive={immersive}
                historyCompact={immersive && historyExpanded && !item.isLastMessage}
                immersivePortraitExternal={false}
            />
        )
    }

    const backgroundSource = {
        uri: backgroundImage
            ? Characters.getImageDir(backgroundImage)
            : image
              ? AppDirectory.Assets + image
              : '',
    }

    return (
        <AnimatedChatBackground uri={backgroundSource.uri}>
            {showModelname && appMode === 'local' && (
                <HeaderTitle headerTitle={() => !showSettings && !showChat && <ChatModelName />} />
            )}

            {immersive && historyCount > 0 && (
                <ImmersiveHistoryBar
                    variant="floating"
                    count={historyCount}
                    expanded={historyExpanded}
                    onToggle={() => setHistoryExpanded((value) => !value)}
                />
            )}

            {immersiveCollapsed ? (
                <ImmersiveChatLayout
                    lastItem={collapsedLastItem}
                    lastMessageIndex={lastMessageIndex}
                    showPortrait={showImmersivePortrait}
                />
            ) : (
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
                        immersive
                            ? null
                            : autoScroll
                              ? null
                              : { minIndexForVisible: 1, autoscrollToTopThreshold: 50 }
                    }
                    keyboardShouldPersistTaps="handled"
                    inverted
                    data={visibleList}
                    keyExtractor={(item) => item.key}
                    renderItem={renderItems}
                    onScrollBeginDrag={() => {
                        useChatActionsState.getState().setActiveIndex(undefined)
                    }}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={(item) => {
                        if (immersive) return
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
                        rowGap: immersive ? 0 : 8,
                    }}
                    ListFooterComponent={() => <ChatFooter />}
                />
            )}

            <ChatHeaderGradient />
        </AnimatedChatBackground>
    )
}

export default ChatWindow
