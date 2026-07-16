import { Pressable, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useShallow } from 'zustand/react/shallow'

import { AppSettings } from '@lib/constants/GlobalValues'
import { useAppMode } from '@lib/state/AppMode'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

import ChatAttachments from './ChatAttachments'
import { useChatEditorStore } from './ChatEditor'
import ChatQuickActions, { useChatActionsState } from './ChatQuickActions'
import ChatSwipes from './ChatSwipes'
import ChatText from './ChatText'
import ChatTextLast from './ChatTextLast'

type ChatTextProps = {
    index: number
    nowGenerating: boolean
    isLastMessage: boolean
    isGreeting: boolean
    immersive?: boolean
    historyCompact?: boolean
    immersiveToolbarExternal?: boolean
}

const ChatBubble: React.FC<ChatTextProps> = ({
    index,
    nowGenerating,
    isLastMessage,
    isGreeting,
    immersive = false,
    historyCompact = false,
    immersiveToolbarExternal = false,
}) => {
    const message = Chats.useEntryData(index)
    const { appMode } = useAppMode()
    const [showTPS] = useMMKVBoolean(AppSettings.ShowTokenPerSecond)
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()

    const { setShowOptions } = useChatActionsState(
        useShallow((state) => ({
            setShowOptions: state.setActiveIndex,
        }))
    )

    const showEditor = useChatEditorStore((state) => state.show)
    const handleEnableEdit = () => {
        if (!nowGenerating) showEditor(index)
    }

    const hasSwipes = message?.swipes?.length > 1
    const showSwipe =
        !message.is_user &&
        isLastMessage &&
        (immersive || hasSwipes || !isGreeting)
    const timings = message.swipes[message.swipe_id].timings

    const isImmersiveDialogue = immersive && isLastMessage && !message.is_user
    const isImmersiveUser = immersive && isLastMessage && message.is_user

    const bubbleStyle = historyCompact
        ? {
              backgroundColor: color.neutral._200 + '99',
              borderColor: color.neutral._300,
              borderWidth: 1,
              marginBottom: 2,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              minHeight: 28,
              borderRadius: borderRadius.s,
          }
        : isImmersiveDialogue
          ? {
                backgroundColor: color.neutral._100 + 'dd',
                borderColor: color.neutral._300 + 'aa',
                borderWidth: 1,
                marginBottom: spacing.sm,
                paddingVertical: spacing.l,
                paddingHorizontal: spacing.l,
                minHeight: 48,
                borderRadius: borderRadius.s,
                overflow: 'visible',
            }
          : isImmersiveUser
            ? {
                  backgroundColor: color.primary._500 + '33',
                  borderColor: color.primary._500 + '55',
                  borderWidth: 1,
                  marginBottom: 4,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.m,
                  minHeight: 40,
                  borderRadius: borderRadius.m,
              }
            : {
                  backgroundColor: color.neutral._200,
                  borderColor: color.neutral._200,
                  borderWidth: 1,
                  marginBottom: showSwipe ? 0 : 4,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.m,
                  minHeight: 40,
                  borderRadius: borderRadius.m,
                  shadowColor: color.shadow,
                  boxShadow: [
                      {
                          offsetX: 1,
                          offsetY: 1,
                          spreadDistance: 2,
                          color: color.shadow,
                          blurRadius: 4,
                      },
                  ],
              }

    const bubbleContent = (
        <>
            {isLastMessage ? (
                <ChatTextLast
                    nowGenerating={nowGenerating}
                    index={index}
                    immersive={isImmersiveDialogue}
                />
            ) : (
                <ChatText nowGenerating={nowGenerating} index={index} />
            )}
            {!historyCompact && <ChatAttachments index={index} />}
            {!historyCompact && (
                <View
                    style={{
                        flexDirection: 'row',
                    }}>
                    {showTPS && appMode === 'local' && timings && !immersive && (
                        <Text
                            style={{
                                color: color.text._500,
                                fontWeight: '300',
                                textAlign: 'right',
                                fontSize: fontSize.s,
                            }}>
                            {`Prompt: ${getFiniteValue(timings.prompt_per_second)} t/s`}
                            {`   Text Gen: ${getFiniteValue(timings.predicted_per_second)} t/s`}
                        </Text>
                    )}

                    <ChatQuickActions
                        nowGenerating={nowGenerating}
                        isLastMessage={isLastMessage}
                        index={index}
                    />
                </View>
            )}
        </>
    )

    return (
        <View>
            {showSwipe && isImmersiveDialogue && !immersiveToolbarExternal && (
                <ChatSwipes
                    index={index}
                    nowGenerating={nowGenerating}
                    isGreeting={isGreeting}
                    immersive
                />
            )}
            {isImmersiveDialogue ? (
                <Pressable
                    onPress={() => {
                        setShowOptions(nowGenerating ? undefined : index)
                    }}
                    style={bubbleStyle}
                    onLongPress={handleEnableEdit}>
                    {bubbleContent}
                </Pressable>
            ) : (
                <Pressable
                    onPress={() => {
                        setShowOptions(nowGenerating ? undefined : index)
                    }}
                    style={bubbleStyle}
                    onLongPress={handleEnableEdit}>
                    {bubbleContent}
                </Pressable>
            )}
            {showSwipe && !isImmersiveDialogue && (
                <ChatSwipes index={index} nowGenerating={nowGenerating} isGreeting={isGreeting} />
            )}
        </View>
    )
}

const getFiniteValue = (value: number | null) => {
    if (!value || !isFinite(value)) return (0).toFixed(2)
    return value.toFixed(2)
}

export default ChatBubble
