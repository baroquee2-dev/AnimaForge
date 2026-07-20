import { Pressable, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useShallow } from 'zustand/react/shallow'

import { AppSettings } from '@lib/constants/GlobalValues'
import { useAppMode } from '@lib/state/AppMode'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

import { useIsVisualNovelPresentation } from './ChatLayoutContext'
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
    historyCompact?: boolean
    toolbarExternal?: boolean
}

const ChatBubble: React.FC<ChatTextProps> = ({
    index,
    nowGenerating,
    isLastMessage,
    isGreeting,
    historyCompact = false,
    toolbarExternal = false,
}) => {
    const message = Chats.useEntryData(index)
    const { appMode } = useAppMode()
    const isVisualNovel = useIsVisualNovelPresentation()
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
        (isVisualNovel || hasSwipes || !isGreeting)
    const timings = message.swipes[message.swipe_id].timings

    const isVisualNovelDialogue = isVisualNovel && isLastMessage && !message.is_user
    const isVisualNovelUser = isVisualNovel && isLastMessage && message.is_user

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
        : isVisualNovelDialogue
          ? null
          : isVisualNovelUser
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
                    visualNovelDialogue={isVisualNovelDialogue}
                    onBubblePress={
                        isVisualNovelDialogue
                            ? () => setShowOptions(nowGenerating ? undefined : index)
                            : undefined
                    }
                    onBubbleLongPress={isVisualNovelDialogue ? handleEnableEdit : undefined}
                />
            ) : (
                <ChatText nowGenerating={nowGenerating} index={index} />
            )}
            {!historyCompact && <ChatAttachments index={index} />}
            {!historyCompact && (
                <View
                    pointerEvents="box-none"
                    style={{
                        flexDirection: 'row',
                    }}>
                    {showTPS && appMode === 'local' && timings && !isVisualNovel && (
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
                        visualNovelDialogue={isVisualNovelDialogue}
                    />
                </View>
            )}
        </>
    )

    return (
        <View>
            {showSwipe && isVisualNovelDialogue && !toolbarExternal && (
                <ChatSwipes
                    index={index}
                    nowGenerating={nowGenerating}
                    isGreeting={isGreeting}
                    visualNovelDialogue
                />
            )}
            {isVisualNovelDialogue ? (
                <View style={{ width: '100%', position: 'relative' }}>
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: spacing.l,
                            zIndex: 2,
                            backgroundColor: color.neutral._300 + 'f2',
                            borderColor: color.neutral._500,
                            borderWidth: 1,
                            paddingHorizontal: spacing.xl,
                            paddingVertical: spacing.sm,
                            borderRadius: borderRadius.m,
                        }}>
                        <Text
                            style={{
                                color: color.text._100,
                                fontSize: fontSize.l,
                                fontWeight: '700',
                            }}>
                            {message.name}
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '100%',
                            marginTop: spacing.l,
                            backgroundColor: color.neutral._100 + 'dd',
                            borderColor: color.neutral._400,
                            borderWidth: 1,
                            borderTopLeftRadius: borderRadius.l,
                            borderTopRightRadius: borderRadius.l,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            paddingTop: spacing.xl3,
                            paddingHorizontal: spacing.l,
                            paddingBottom: spacing.l,
                            minHeight: 48,
                            overflow: 'visible',
                        }}>
                        {bubbleContent}
                    </View>
                </View>
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
            {showSwipe && !isVisualNovelDialogue && (
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
