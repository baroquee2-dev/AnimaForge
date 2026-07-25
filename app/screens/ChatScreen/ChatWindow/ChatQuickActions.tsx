import { setStringAsync } from 'expo-clipboard'
import React, { useCallback } from 'react'
import { View } from 'react-native'
import Animated, { StretchInY, StretchOutY, ZoomIn, ZoomOut } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import Alert from '@components/views/Alert'
import { useBackAction } from '@lib/hooks/BackAction'
import i18n from '@lib/i18n'
import { Chats, useInference } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { useTTS } from '@lib/state/TTS'
import { Theme } from '@lib/theme/ThemeManager'

import { useChatEditorStore } from './ChatEditor'
import ChatTTS from './ChatTTS'

interface OptionsStateProps {
    activeIndex?: number
    setActiveIndex: (n: number | undefined) => void
}

useInference.subscribe(({ nowGenerating }) => {
    if (nowGenerating) {
        useChatActionsState.getState().setActiveIndex(undefined)
    }
})
export const useChatActionsState = create<OptionsStateProps>()((set, get) => ({
    setActiveIndex: (n) => set({ activeIndex: get().activeIndex === n ? undefined : n }),
}))

interface ChatActionProps {
    index: number
    nowGenerating: boolean
    isLastMessage: boolean
    visualNovelDialogue?: boolean
    immersiveDialogue?: boolean
}

const ChatQuickActions: React.FC<ChatActionProps> = ({
    index,
    nowGenerating,
    isLastMessage,
    visualNovelDialogue = false,
    immersiveDialogue = false,
}) => {
    const { t } = useTranslation()
    const { activeIndex, setShowOptions } = useChatActionsState(
        useShallow((state) => ({
            setShowOptions: state.setActiveIndex,
            activeIndex: state.activeIndex,
        }))
    )
    const showEditor = useChatEditorStore((state) => state.show)
    const { color } = Theme.useTheme()
    const { deleteEntry } = Chats.useEntry()
    const { chatId, loadChat } = Chats.useChat()
    const { swipe } = Chats.useSwipeData(index)
    const { activeChatIndex } = useTTS()
    const showOptions = activeIndex === index

    const handleEnableEdit = () => {
        if (showOptions) setShowOptions(undefined)
        if (!nowGenerating) showEditor(index)
    }

    const handleFork = () => {
        if (!chatId) return
        Alert.alert({
            title: t('chat.forkTitle'),
            description: t('chat.forkDesc'),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('chat.forkConfirm'),
                    onPress: async () => {
                        const newChatId = await Chats.db.mutate.cloneChatFromId(chatId, index + 1)
                        if (!newChatId) {
                            Logger.errorToast(i18n.t('chat.cloneFailed'))
                            return
                        }
                        setShowOptions(undefined)
                        loadChat(newChatId)
                    },
                },
            ],
        })
    }

    const backAction = useCallback(() => {
        if (!showOptions || !swipe) return false
        setShowOptions(undefined)
        return true
    }, [showOptions, setShowOptions, swipe])

    useBackAction(backAction)

    if (!swipe) return

    const isSpeaking = index === activeChatIndex
    if (!isSpeaking && (!showOptions || nowGenerating)) return

    const toolbar = (
        <Animated.View
            entering={StretchInY.duration(100)}
            exiting={StretchOutY.duration(100)}
            style={{
                flexDirection: 'row',
                columnGap: 16,
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: color.primary._500,
                backgroundColor: color.neutral._100 + 'cc',
                boxShadow: [
                    {
                        offsetX: 1,
                        offsetY: 1,
                        color: color.shadow,
                        spreadDistance: 1,
                        blurRadius: 4,
                    },
                ],
            }}>
            {!(isLastMessage && nowGenerating) && (
                <>
                    <Animated.View
                        style={{ flexDirection: 'row' }}
                        entering={ZoomIn.duration(200)}
                        exiting={ZoomOut.duration(200)}>
                        <ThemedButton
                            variant="tertiary"
                            iconName="delete"
                            iconSize={24}
                            iconStyle={{
                                color: color.error._400,
                            }}
                            onPress={() => {
                                if (showOptions) setShowOptions(undefined)
                                deleteEntry(index)
                            }}
                        />
                        <View
                            style={{
                                borderColor: color.primary._500,
                                borderLeftWidth: 1,
                                marginLeft: 12,
                                marginRight: 4,
                            }}
                        />
                    </Animated.View>

                    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                        <ThemedButton
                            variant="tertiary"
                            iconName="fork"
                            iconSize={22}
                            iconStyle={{
                                color: color.text._500,
                            }}
                            onPress={handleFork}
                        />
                    </Animated.View>

                    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                        <ThemedButton
                            variant="tertiary"
                            iconName="copy"
                            iconSize={22}
                            iconStyle={{
                                color: color.text._500,
                            }}
                            onPress={() => {
                                if (showOptions) setShowOptions(undefined)
                                setStringAsync(swipe.swipe)
                                    .then(() => {
                                        Logger.infoToast(i18n.t('chat.copied'))
                                    })
                                    .catch(() => {
                                        Logger.errorToast(i18n.t('chat.copyFailed'))
                                    })
                            }}
                        />
                    </Animated.View>

                    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                        <ThemedButton
                            variant="tertiary"
                            iconName="edit"
                            iconSize={24}
                            iconStyle={{
                                color: color.text._500,
                            }}
                            onPress={handleEnableEdit}
                        />
                    </Animated.View>
                </>
            )}
            <ChatTTS index={index} />
        </Animated.View>
    )

    if (visualNovelDialogue || immersiveDialogue) {
        return (
            <View
                pointerEvents="box-none"
                style={{ alignSelf: 'stretch', alignItems: 'flex-end', marginTop: 4 }}>
                {toolbar}
            </View>
        )
    }

    return (
        <View
            pointerEvents="box-none"
            style={{
                flex: 1,
                alignItems: 'flex-end',
                position: 'absolute',
                bottom: -2,
                right: -4,
                width: '100%',
            }}>
            {toolbar}
        </View>
    )
}

export default ChatQuickActions
