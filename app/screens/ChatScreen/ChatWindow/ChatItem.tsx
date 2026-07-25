import { StyleSheet, View } from 'react-native'

import { useInference } from '@lib/state/Chat'

import { useIsImmersivePresentation, useIsVisualNovelPresentation } from '@lib/chat/ChatLayoutContext'
import ChatBubble from './ChatBubble'
import ChatFrame from './ChatFrame'

type ChatItemProps = {
    index: number
    isLastMessage: boolean
    isGreeting: boolean
    historyCompact?: boolean
    portraitExternal?: boolean
    toolbarExternal?: boolean
}

const ChatItem: React.FC<ChatItemProps> = ({
    index,
    isLastMessage,
    isGreeting,
    historyCompact = false,
    portraitExternal = false,
    toolbarExternal = false,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    const isVisualNovel = useIsVisualNovelPresentation()
    const isImmersive = useIsImmersivePresentation()

    return (
        <View
            style={[
                styles.chatItem,
                { zIndex: index },
                (isVisualNovel || isImmersive) && isLastMessage && styles.presentationLastItem,
                historyCompact && styles.historyCompactItem,
            ]}>
            <ChatFrame
                index={index}
                nowGenerating={nowGenerating}
                isLast={isLastMessage}
                historyCompact={historyCompact}
                portraitExternal={portraitExternal}>
                <ChatBubble
                    nowGenerating={nowGenerating}
                    index={index}
                    isLastMessage={isLastMessage}
                    isGreeting={isGreeting}
                    historyCompact={historyCompact}
                    toolbarExternal={toolbarExternal}
                />
            </ChatFrame>
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
