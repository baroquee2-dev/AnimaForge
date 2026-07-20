import { useEffect, useState } from 'react'
import { FlatList } from 'react-native'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import { Chats } from '@lib/state/Chat'

import { useChatLayoutContext } from '../ChatLayoutContext'
import ChatFooter from '../ChatFooter'
import ChatItem from '../ChatItem'
import ImmersiveHistoryBar from '../ImmersiveHistoryBar'
import { useInputHeightStore } from '../../ChatInput'
import { useChatHistoryMeta, useChatListItems } from './useChatListItems'
import VisualNovelCollapsedView from './VisualNovelCollapsedView'

const VisualNovelChatLayout = () => {
    const { layout } = useChatLayoutContext()
    const { chat } = Chats.useChat()
    const [historyExpanded, setHistoryExpanded] = useState(false)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const list = useChatListItems()
    const { historyCount, lastMessageIndex } = useChatHistoryMeta()

    const collapsed = !historyExpanded
    const visibleList = collapsed ? list.filter((item) => item.isLastMessage) : list
    const collapsedLastItem = visibleList[0]

    useEffect(() => {
        setHistoryExpanded(false)
    }, [layout, chat?.id])

    const renderItems = ({ item }: { item: (typeof list)[number] }) => (
        <ChatItem
            index={item.index}
            isLastMessage={item.isLastMessage}
            isGreeting={item.isGreeting}
            historyCompact={historyExpanded && !item.isLastMessage}
        />
    )

    return (
        <>
            {historyCount > 0 && (
                <ImmersiveHistoryBar
                    variant="floating"
                    count={historyCount}
                    expanded={historyExpanded}
                    onToggle={() => setHistoryExpanded((value) => !value)}
                />
            )}

            {collapsed ? (
                <VisualNovelCollapsedView
                    lastItem={collapsedLastItem}
                    lastMessageIndex={lastMessageIndex}
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
                    keyboardShouldPersistTaps="handled"
                    inverted
                    data={visibleList}
                    keyExtractor={(item) => item.key}
                    renderItem={renderItems}
                    contentContainerStyle={{
                        paddingTop: chatInputHeight,
                        paddingBottom: 32,
                    }}
                    ListFooterComponent={() => <ChatFooter />}
                />
            )}
        </>
    )
}

export default VisualNovelChatLayout
