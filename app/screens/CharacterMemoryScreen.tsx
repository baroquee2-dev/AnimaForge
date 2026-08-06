import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useMMKVBoolean } from 'react-native-mmkv'
import { SafeAreaView } from 'react-native-safe-area-context'

import ThemedSwitch from '@components/input/ThemedSwitch'
import Avatar from '@components/views/Avatar'
import BottomSheet from '@components/views/BottomSheet'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Characters } from '@lib/state/Characters'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'

const CharacterMemoryScreen = () => {
    const { t } = useTranslation()
    const { color, spacing, fontSize, borderRadius } = Theme.useTheme()
    const [autoSummary, setAutoSummary] = useMMKVBoolean(AppSettings.AutoSummary)
    const [showCharacterSheet, setShowCharacterSheet] = useState(false)

    const { data } = useLiveQuery(Characters.db.query.cardListQuery('character', 'modified'), [])

    const handleSelectCharacter = (character: { id: number; name: string }) => {
        Logger.info(`Selected character for memory management: ${character.name} (${character.id})`)
        setShowCharacterSheet(false)
        // TODO: Navigate to character-specific memory management
    }

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            <HeaderTitle title={t('nav.characterMemory')} />
            <KeyboardAwareScrollView style={{ paddingHorizontal: 16 }}>
                <ThemedSwitch
                    label={t('chat.autoSummary')}
                    description={t('memory.autoSummaryDesc')}
                    value={autoSummary}
                    onChangeValue={setAutoSummary}
                />

                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: spacing.m,
                        borderTopWidth: 1,
                        borderTopColor: color.neutral._200,
                    }}
                    onPress={() => setShowCharacterSheet(true)}>
                    <Text style={{ fontSize: fontSize.l, color: color.text._100 }}>
                        {t('memory.contentManagement')}
                    </Text>
                    <Text style={{ fontSize: fontSize.xl, color: color.text._300 }}>›</Text>
                </TouchableOpacity>
            </KeyboardAwareScrollView>

            <BottomSheet visible={showCharacterSheet} setVisible={setShowCharacterSheet}>
                <Text
                    style={{
                        fontSize: fontSize.xl,
                        fontWeight: '600',
                        color: color.text._100,
                        marginBottom: spacing.m,
                    }}>
                    {t('memory.selectCharacter')}
                </Text>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.m,
                                paddingVertical: spacing.m,
                            }}
                            onPress={() => handleSelectCharacter(item)}>
                            <Avatar
                                targetImage={Characters.getImageDir(item.image_id)}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: borderRadius.m,
                                    backgroundColor: color.neutral._200,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: fontSize.l,
                                    color: color.text._100,
                                }}
                                numberOfLines={1}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => (
                        <View
                            style={{
                                height: 1,
                                backgroundColor: color.neutral._200,
                            }}
                        />
                    )}
                    ListEmptyComponent={() => (
                        <Text
                            style={{
                                textAlign: 'center',
                                color: color.text._300,
                                paddingVertical: spacing.xl,
                            }}>
                            {t('characterList.empty')}
                        </Text>
                    )}
                />
            </BottomSheet>
        </SafeAreaView>
    )
}

export default CharacterMemoryScreen
