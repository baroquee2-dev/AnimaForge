import { AntDesign } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ThemedButton from '@components/buttons/ThemedButton'
import DropdownSheet from '@components/input/DropdownSheet'
import ThemedSwitch from '@components/input/ThemedSwitch'
import ThemedTextInput from '@components/input/ThemedTextInput'
import Alert from '@components/views/Alert'
import BottomSheet from '@components/views/BottomSheet'
import HeaderTitle from '@components/views/HeaderTitle'
import { Chats } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { getCategoryLabel } from '@lib/summary/KeyFactsFormat'
import { Theme } from '@lib/theme/ThemeManager'
import { CHAT_KEY_FACT_CATEGORIES, ChatKeyFactCategory, ChatKeyFactType } from 'db/schema'

type DraftFact = {
    id?: number
    category: ChatKeyFactCategory
    key: string
    value: string
    note: string
    stale: boolean
}

const emptyDraft = (): DraftFact => ({
    category: 'identity',
    key: '',
    value: '',
    note: '',
    stale: false,
})

const ChatKeyFactsEditorScreen = () => {
    const { t } = useTranslation()
    const styles = useStyles()
    const { color, spacing } = Theme.useTheme()
    const router = useRouter()
    const params = useLocalSearchParams<{ chatId?: string; chatName?: string }>()
    const chatId = Number(params.chatId)
    const chatName = typeof params.chatName === 'string' ? params.chatName : ''

    const [facts, setFacts] = useState<ChatKeyFactType[]>([])
    const [loading, setLoading] = useState(true)
    const [draft, setDraft] = useState<DraftFact | undefined>(undefined)
    const [saving, setSaving] = useState(false)

    const refresh = useCallback(async () => {
        const rows = await Chats.db.query.keyFacts(chatId)
        setFacts(rows)
        await Chats.useChatState.getState().refreshKeyFacts(chatId)
    }, [chatId])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            if (!Number.isFinite(chatId) || chatId <= 0) {
                Logger.errorToast(t('keyFacts.missingChat'))
                router.back()
                return
            }
            const chat = await Chats.db.query.chatExists(chatId)
            if (cancelled) return
            if (!chat) {
                Logger.errorToast(t('keyFacts.missingChat'))
                router.back()
                return
            }
            setFacts(await Chats.db.query.keyFacts(chatId))
            setLoading(false)
        }
        load()
        return () => {
            cancelled = true
        }
    }, [chatId, router, t])

    const sections = useMemo(
        () =>
            CHAT_KEY_FACT_CATEGORIES.map((category) => ({
                category: category,
                rows: facts.filter((fact) => fact.category === category),
            })).filter((section) => section.rows.length > 0),
        [facts]
    )

    const verifyDraft = (candidate: DraftFact) => {
        if (!candidate.key.trim()) return t('keyFacts.keyEmpty')
        if (!candidate.value.trim()) return t('keyFacts.valueEmpty')
        const clash = facts.some(
            (fact) => fact.id !== candidate.id && fact.key === candidate.key.trim()
        )
        return clash ? t('keyFacts.keyDuplicate') : ''
    }

    const handleSaveDraft = async () => {
        if (!draft || saving) return
        const error = verifyDraft(draft)
        if (error) {
            Logger.warnToast(error)
            return
        }
        setSaving(true)
        try {
            await Chats.db.mutate.upsertKeyFact(chatId, {
                id: draft.id,
                category: draft.category,
                key: draft.key.trim(),
                value: draft.value.trim(),
                note: draft.note.trim(),
                stale: draft.stale,
            })
            await refresh()
            setDraft(undefined)
            Logger.infoToast(t('keyFacts.saved'))
        } catch (e) {
            Logger.errorToast(t('keyFacts.saveFailed'))
            Logger.error(`${e}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (fact: ChatKeyFactType) => {
        Alert.alert({
            title: t('keyFacts.deleteTitle'),
            description: t('keyFacts.deleteDesc', { name: fact.key }),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('common.delete'),
                    type: 'warning',
                    onPress: async () => {
                        try {
                            await Chats.db.mutate.deleteKeyFact(fact.id)
                            await refresh()
                            Logger.infoToast(t('keyFacts.deleted'))
                        } catch (e) {
                            Logger.errorToast(t('keyFacts.deleteFailed'))
                            Logger.error(`${e}`)
                        }
                    },
                },
            ],
        })
    }

    const handleDeleteAll = () => {
        Alert.alert({
            title: t('keyFacts.deleteAllTitle'),
            description: t('keyFacts.deleteAllDesc'),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('keyFacts.deleteAll'),
                    type: 'warning',
                    onPress: async () => {
                        try {
                            await Chats.db.mutate.deleteAllKeyFacts(chatId)
                            await refresh()
                            Logger.infoToast(t('keyFacts.deleted'))
                        } catch (e) {
                            Logger.errorToast(t('keyFacts.deleteFailed'))
                            Logger.error(`${e}`)
                        }
                    },
                },
            ],
        })
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <HeaderTitle title={t('keyFacts.edit')} />
            <View style={styles.header}>
                {!!chatName && (
                    <Text style={styles.chatName} numberOfLines={2}>
                        {chatName}
                    </Text>
                )}
                <Text style={styles.hint}>{t('keyFacts.editHint')}</Text>
            </View>

            <FlatList
                data={sections}
                keyExtractor={(item) => item.category}
                contentContainerStyle={styles.list}
                ListEmptyComponent={() =>
                    loading ? null : <Text style={styles.empty}>{t('keyFacts.empty')}</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{getCategoryLabel(item.category)}</Text>
                        {item.rows.map((fact) => (
                            <TouchableOpacity
                                key={fact.id}
                                activeOpacity={0.7}
                                style={[styles.factCard, fact.stale && styles.factCardStale]}
                                onPress={() =>
                                    setDraft({
                                        id: fact.id,
                                        category: fact.category,
                                        key: fact.key,
                                        value: fact.value,
                                        note: fact.note,
                                        stale: fact.stale,
                                    })
                                }>
                                <View style={styles.factHeader}>
                                    <Text style={styles.factKey} numberOfLines={1}>
                                        {fact.key}
                                    </Text>
                                    {fact.stale && (
                                        <Text style={styles.staleTag}>
                                            {t('keyFacts.staleLabel')}
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        hitSlop={8}
                                        onPress={() => handleDelete(fact)}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('common.delete')}>
                                        <AntDesign
                                            name="delete"
                                            size={16}
                                            color={color.error._500}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.factValue}>{fact.value}</Text>
                                {!!fact.previous_value && (
                                    <Text style={styles.factPrevious}>
                                        {t('keyFacts.previousValue', {
                                            value: fact.previous_value,
                                        })}
                                    </Text>
                                )}
                                {!!fact.note && <Text style={styles.factNote}>{fact.note}</Text>}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />

            <View style={styles.actions}>
                <ThemedButton
                    label={t('keyFacts.deleteAll')}
                    iconName="delete"
                    variant={loading || facts.length === 0 ? 'disabled' : 'critical'}
                    onPress={handleDeleteAll}
                />
                <ThemedButton
                    label={t('keyFacts.addFact')}
                    iconName="plus"
                    variant={loading ? 'disabled' : 'secondary'}
                    onPress={() => setDraft(emptyDraft())}
                />
            </View>

            <BottomSheet visible={!!draft} setVisible={(v) => !v && setDraft(undefined)}>
                {draft && (
                    <View style={{ rowGap: spacing.l }}>
                        <Text style={styles.sheetTitle}>
                            {draft.id ? t('keyFacts.editFact') : t('keyFacts.newFact')}
                        </Text>
                        <DropdownSheet
                            data={[...CHAT_KEY_FACT_CATEGORIES]}
                            selected={draft.category}
                            labelExtractor={getCategoryLabel}
                            modalTitle={t('keyFacts.categoryLabel')}
                            onChangeValue={(category) => setDraft({ ...draft, category })}
                        />
                        <ThemedTextInput
                            label={t('keyFacts.keyLabel')}
                            placeholder={t('keyFacts.keyPlaceholder')}
                            value={draft.key}
                            onChangeText={(key) => setDraft({ ...draft, key })}
                        />
                        <ThemedTextInput
                            label={t('keyFacts.valueLabel')}
                            placeholder={t('keyFacts.valuePlaceholder')}
                            numberOfLines={3}
                            value={draft.value}
                            onChangeText={(value) => setDraft({ ...draft, value })}
                        />
                        <ThemedTextInput
                            label={t('keyFacts.noteLabel')}
                            placeholder={t('keyFacts.notePlaceholder')}
                            numberOfLines={2}
                            value={draft.note}
                            onChangeText={(note) => setDraft({ ...draft, note })}
                        />
                        <ThemedSwitch
                            label={t('keyFacts.markStale')}
                            value={draft.stale}
                            onChangeValue={(stale) => setDraft({ ...draft, stale })}
                        />
                        <ThemedButton
                            label={t('common.save')}
                            iconName="check"
                            variant={saving ? 'disabled' : 'secondary'}
                            onPress={handleSaveDraft}
                        />
                    </View>
                )}
            </BottomSheet>
        </SafeAreaView>
    )
}

export default ChatKeyFactsEditorScreen

const useStyles = () => {
    const { color, spacing, fontSize, borderRadius, borderWidth } = Theme.useTheme()
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
        list: {
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
        },
        empty: {
            color: color.text._400,
            fontSize: fontSize.m,
            textAlign: 'center',
            paddingVertical: spacing.xl3,
        },
        section: {
            marginBottom: spacing.l,
        },
        sectionTitle: {
            color: color.primary._400,
            fontSize: fontSize.s,
            fontWeight: '600',
            marginBottom: spacing.s,
        },
        factCard: {
            borderRadius: borderRadius.m,
            borderWidth: borderWidth.m,
            borderColor: color.neutral._300,
            padding: spacing.m,
            marginBottom: spacing.s,
        },
        factCardStale: {
            opacity: 0.6,
            borderStyle: 'dashed',
        },
        factHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: spacing.s,
        },
        factKey: {
            flex: 1,
            color: color.text._100,
            fontSize: fontSize.m,
            fontWeight: '600',
        },
        staleTag: {
            color: color.text._400,
            fontSize: fontSize.s,
        },
        factValue: {
            color: color.text._200,
            fontSize: fontSize.s,
            marginTop: spacing.s,
        },
        factPrevious: {
            color: color.text._400,
            fontSize: fontSize.s,
            marginTop: spacing.xs,
            textDecorationLine: 'line-through',
        },
        factNote: {
            color: color.text._400,
            fontSize: fontSize.s,
            fontStyle: 'italic',
            marginTop: spacing.xs,
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
        sheetTitle: {
            color: color.text._100,
            fontSize: fontSize.xl,
            fontWeight: '600',
        },
    })
}
