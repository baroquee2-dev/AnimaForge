import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ThemedButton from '@components/buttons/ThemedButton'
import ThemedTextInput from '@components/input/ThemedTextInput'
import Alert from '@components/views/Alert'
import HeaderTitle from '@components/views/HeaderTitle'
import { Chats } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'

const ChatSummaryEditorScreen = () => {
    const { t } = useTranslation()
    const styles = useStyles()
    const router = useRouter()
    const params = useLocalSearchParams<{ chatId?: string; chatName?: string }>()
    const chatId = Number(params.chatId)
    const chatName = typeof params.chatName === 'string' ? params.chatName : ''

    const [text, setText] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            if (!Number.isFinite(chatId) || chatId <= 0) {
                Logger.errorToast(t('chat.summaryMissingChat'))
                router.back()
                return
            }
            const chat = await Chats.db.query.chatExists(chatId)
            if (cancelled) return
            if (!chat) {
                Logger.errorToast(t('chat.summaryMissingChat'))
                router.back()
                return
            }
            setText(chat.summary ?? '')
            setLoading(false)
        }
        load()
        return () => {
            cancelled = true
        }
    }, [chatId, router, t])

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        try {
            await Chats.useChatState.getState().setChatSummary(chatId, text)
            Logger.infoToast(t('chat.summarySaved'))
            router.back()
        } catch (error) {
            Logger.errorToast(t('chat.summarySaveFailed'))
            Logger.error(`${error}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = () => {
        Alert.alert({
            title: t('chat.deleteSummaryTitle'),
            description: t('chat.deleteSummaryDesc'),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('chat.deleteSummaryConfirm'),
                    type: 'warning',
                    onPress: async () => {
                        try {
                            await Chats.useChatState.getState().setChatSummary(chatId, '')
                            Logger.infoToast(t('chat.summaryDeleted'))
                            router.back()
                        } catch (error) {
                            Logger.errorToast(t('chat.summaryDeleteFailed'))
                            Logger.error(`${error}`)
                        }
                    },
                },
            ],
        })
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <HeaderTitle title={t('chat.editSummary')} />
            <View style={styles.header}>
                {!!chatName && (
                    <Text style={styles.chatName} numberOfLines={2}>
                        {chatName}
                    </Text>
                )}
                <Text style={styles.hint}>{t('chat.editSummaryHint')}</Text>
            </View>
            <ThemedTextInput
                multiline
                scrollEnabled
                value={text}
                onChangeText={setText}
                editable={!loading && !saving}
                placeholder={t('chat.summaryPlaceholder')}
                containerStyle={styles.inputContainer}
                style={styles.input}
            />
            <View style={styles.actions}>
                <ThemedButton
                    label={t('chat.deleteSummary')}
                    iconName="delete"
                    variant={loading || saving || !text.trim() ? 'disabled' : 'critical'}
                    onPress={handleDelete}
                />
                <ThemedButton
                    label={t('common.save')}
                    iconName="check"
                    variant={loading || saving ? 'disabled' : 'secondary'}
                    onPress={handleSave}
                />
            </View>
        </SafeAreaView>
    )
}

export default ChatSummaryEditorScreen

const useStyles = () => {
    const { color, spacing, fontSize } = Theme.useTheme()
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: color.neutral._100,
        },
        header: {
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.l,
            paddingBottom: spacing.m,
        },
        chatName: {
            color: color.text._100,
            fontSize: fontSize.l,
            marginBottom: spacing.s,
        },
        hint: {
            color: color.text._400,
            fontSize: fontSize.s,
        },
        inputContainer: {
            flex: 1,
            paddingHorizontal: spacing.xl,
            minHeight: 0,
        },
        input: {
            flex: 1,
            textAlignVertical: 'top',
        },
        actions: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.l,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: color.neutral._300,
            columnGap: spacing.m,
        },
    })
}
