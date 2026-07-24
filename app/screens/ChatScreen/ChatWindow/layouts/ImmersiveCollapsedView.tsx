import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { Chats, useInference } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

import { useInputHeightStore } from '../../ChatInput'
import ChatFooter from '../ChatFooter'
import ChatItem from '../ChatItem'
import ChatSwipes from '../ChatSwipes'
import { IMMERSIVE_CHROME } from '@lib/chat/immersiveChrome'
import {
    IMMERSIVE_DIALOGUE_LEFT_PADDING,
    getImmersiveDialogueWidth,
} from '@lib/chat/immersiveLayout'
import type { ChatListItem } from '@lib/chat/useChatListItems'

type ImmersiveCollapsedViewProps = {
    lastItem?: ChatListItem
    lastMessageIndex: number
}

const ImmersiveCollapsedView: React.FC<ImmersiveCollapsedViewProps> = ({
    lastItem,
    lastMessageIndex,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    const chatInputHeight = useInputHeightStore(useShallow((state) => state.height))
    const { color, borderRadius } = Theme.useTheme()
    const lastMessage = Chats.useChatState((state) =>
        lastItem
            ? state.data?.messages?.find((item) => item.id === lastItem.entryId)
            : undefined
    )
    const showSwipeToolbar =
        !!lastItem && !!lastMessage && !lastMessage.is_user && lastItem.isLastMessage

    return (
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: chatInputHeight + 8 }}>
            {lastItem ? (
                <View
                    style={{
                        flexShrink: 0,
                        width: '100%',
                        alignItems: 'flex-start',
                        paddingLeft: IMMERSIVE_DIALOGUE_LEFT_PADDING,
                    }}>
                    <View style={{ width: getImmersiveDialogueWidth() }}>
                    <ChatItem
                        index={lastItem.index}
                        entryId={lastItem.entryId}
                        tokenLength={lastItem.tokenLength}
                        isLastMessage={lastItem.isLastMessage}
                        isGreeting={lastItem.isGreeting}
                        portraitExternal
                        toolbarExternal
                    />
                    {showSwipeToolbar && (
                        <View
                            style={{
                                backgroundColor: color.neutral._100 + IMMERSIVE_CHROME.surfaceStrong,
                                borderBottomLeftRadius: borderRadius.l,
                                borderBottomRightRadius: borderRadius.l,
                            }}>
                            <ChatSwipes
                                index={lastItem.index}
                                nowGenerating={nowGenerating}
                                isGreeting={lastItem.isGreeting}
                                immersiveDialogue
                            />
                        </View>
                    )}
                    </View>
                </View>
            ) : (
                <ChatFooter />
            )}
        </View>
    )
}

export default ImmersiveCollapsedView
