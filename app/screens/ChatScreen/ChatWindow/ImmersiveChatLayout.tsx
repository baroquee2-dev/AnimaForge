import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { Chats, useInference } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

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
}

const ImmersiveChatLayout: React.FC<ImmersiveChatLayoutProps> = ({
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
                        immersive
                        immersivePortraitExternal
                        immersiveToolbarExternal
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
                                immersive
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

export default ImmersiveChatLayout
