import { StyleSheet, View } from 'react-native'

import { useInference } from '@lib/state/Chat'

import ChatBubble from './ChatBubble'
import ChatFrame from './ChatFrame'

type ChatItemProps = {
    index: number
    isLastMessage: boolean
    isGreeting: boolean
    immersive?: boolean
    historyCompact?: boolean
    immersivePortraitExternal?: boolean
    immersiveToolbarExternal?: boolean
}

const ChatItem: React.FC<ChatItemProps> = ({
    index,
    isLastMessage,
    isGreeting,
    immersive = false,
    historyCompact = false,
    immersivePortraitExternal = false,
    immersiveToolbarExternal = false,
}) => {
    const nowGenerating = useInference((state) => state.nowGenerating)
    return (
        <View
            style={[
                styles.chatItem,
                { zIndex: index },
                immersive && isLastMessage && styles.immersiveLastItem,
                historyCompact && styles.historyCompactItem,
            ]}>
            <ChatFrame
                index={index}
                nowGenerating={nowGenerating}
                isLast={isLastMessage}
                immersive={immersive}
                historyCompact={historyCompact}
                immersivePortraitExternal={immersivePortraitExternal}>
                <ChatBubble
                    nowGenerating={nowGenerating}
                    index={index}
                    isLastMessage={isLastMessage}
                    isGreeting={isGreeting}
                    immersive={immersive}
                    historyCompact={historyCompact}
                    immersiveToolbarExternal={immersiveToolbarExternal}
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
    immersiveLastItem: {
        paddingHorizontal: 8,
        marginBottom: 0,
    },
    historyCompactItem: {
        opacity: 0.75,
        marginBottom: 2,
    },
})
