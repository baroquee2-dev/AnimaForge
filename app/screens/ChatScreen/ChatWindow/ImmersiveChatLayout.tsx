import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { Chats, useInference } from '@lib/state/Chat'

import { useInputHeightStore } from '../ChatInput'
import ChatFooter from './ChatFooter'
import ChatItem from './ChatItem'
import ChatSwipes from './ChatSwipes'
import ImmersivePortraitHeader from './ImmersivePortraitHeader'

type ImmersiveChatLayoutProps = {
    lastItem?: {
        index: number
        isLastMessage: boolean
        isGreeting: boolean
    }
    lastMessageIndex: number
    showPortrait: boolean
}

const ImmersiveChatLayout: React.FC<ImmersiveChatLayoutProps> = ({
    lastItem,
    lastMessageIndex,
    showPortrait,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const lastMessage = Chats.useChat().chat?.messages?.[lastMessageIndex]
    const immersivePortraitExternal = !!lastMessage && !lastMessage.is_user
    const showSwipeToolbar =
        !!lastItem && !!lastMessage && !lastMessage.is_user && lastItem.isLastMessage

    return (
        <View style={{ flex: 1, paddingBottom: chatInputHeight + 8 }}>
            <View style={{ flex: 1, minHeight: 0 }}>
                {showPortrait && (
                    <ImmersivePortraitHeader
                        index={lastMessageIndex}
                        nowGenerating={nowGenerating}
                    />
                )}
                <View style={{ flex: 1 }} />
            </View>

            {lastItem ? (
                <View style={{ flexShrink: 0, paddingHorizontal: 8 }}>
                    {showSwipeToolbar && (
                        <ChatSwipes
                            index={lastItem.index}
                            nowGenerating={nowGenerating}
                            isGreeting={lastItem.isGreeting}
                            immersive
                        />
                    )}
                    <ChatItem
                        index={lastItem.index}
                        isLastMessage={lastItem.isLastMessage}
                        isGreeting={lastItem.isGreeting}
                        immersive
                        immersivePortraitExternal={immersivePortraitExternal}
                        immersiveToolbarExternal
                    />
                </View>
            ) : (
                <ChatFooter />
            )}
        </View>
    )
}

export default ImmersiveChatLayout
