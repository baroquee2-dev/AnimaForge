import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { Chats, useInference } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

import { useInputHeightStore } from '../../ChatInput'
import ChatFooter from '../ChatFooter'
import ChatItem from '../ChatItem'
import ChatSwipes from '../ChatSwipes'
import ImmersivePortraitHeader from '../ImmersivePortraitHeader'
import type { ChatListItem } from './useChatListItems'

type VisualNovelCollapsedViewProps = {
    lastItem?: ChatListItem
    lastMessageIndex: number
}

const VisualNovelCollapsedView: React.FC<VisualNovelCollapsedViewProps> = ({
    lastItem,
    lastMessageIndex,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const { color, borderRadius } = Theme.useTheme()
    const lastMessage = Chats.useChat().chat?.messages?.[lastMessageIndex]
    const showSwipeToolbar =
        !!lastItem && !!lastMessage && !lastMessage.is_user && lastItem.isLastMessage

    return (
        <View style={{ flex: 1, paddingBottom: chatInputHeight + 8 }}>
            <View style={{ flex: 1, minHeight: 0 }}>
                <ImmersivePortraitHeader nowGenerating={nowGenerating} />
                <View style={{ flex: 1 }} />
            </View>

            {lastItem ? (
                <View style={{ flexShrink: 0 }}>
                    <ChatItem
                        index={lastItem.index}
                        isLastMessage={lastItem.isLastMessage}
                        isGreeting={lastItem.isGreeting}
                        portraitExternal
                        toolbarExternal
                    />
                    {showSwipeToolbar && (
                        <View
                            style={{
                                backgroundColor: color.neutral._100 + 'dd',
                                borderColor: color.neutral._400,
                                borderWidth: 1,
                                borderTopWidth: 0,
                                borderBottomLeftRadius: borderRadius.l,
                                borderBottomRightRadius: borderRadius.l,
                            }}>
                            <ChatSwipes
                                index={lastItem.index}
                                nowGenerating={nowGenerating}
                                isGreeting={lastItem.isGreeting}
                                visualNovelDialogue
                            />
                        </View>
                    )}
                </View>
            ) : (
                <ChatFooter />
            )}
        </View>
    )
}

export default VisualNovelCollapsedView
