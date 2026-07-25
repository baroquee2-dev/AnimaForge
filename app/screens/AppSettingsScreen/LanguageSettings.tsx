import React, { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import DropdownSheet from '@components/input/DropdownSheet'
import {
    AppLanguageId,
    supportedLanguages,
    useLanguageStore,
} from '@lib/i18n'
import { Theme } from '@lib/theme/ThemeManager'

const LanguageSettings = () => {
    const { t } = useTranslation()
    const { color, spacing, fontSize, borderRadius, borderWidth } = Theme.useTheme()
    const language = useLanguageStore((state) => state.language)
    const setLanguage = useLanguageStore((state) => state.setLanguage)

    const options = useMemo(
        () =>
            supportedLanguages.map((item) => ({
                id: item.id,
                label: t(item.labelKey),
            })),
        [t]
    )

    const selected = useMemo(
        () => options.find((item) => item.id === language) ?? options[0],
        [language, options]
    )

    return (
        <View
            style={{
                rowGap: spacing.m,
                padding: spacing.l,
                borderRadius: borderRadius.l,
                borderWidth: borderWidth.m,
                borderColor: color.primary._400,
                backgroundColor: color.neutral._200 + 'cc',
            }}>
            <Text
                style={{
                    color: color.text._100,
                    fontSize: fontSize.xl,
                    fontWeight: '700',
                }}>
                {t('settings.language.title')}
            </Text>
            <Text style={{ color: color.text._400, fontSize: fontSize.s }}>
                {t('settings.language.description')}
            </Text>
            <DropdownSheet
                selected={selected}
                data={options}
                labelExtractor={(item) => item.label}
                onChangeValue={(item) => setLanguage(item.id as AppLanguageId)}
                modalTitle={t('settings.language.modalTitle')}
            />
        </View>
    )
}

export default LanguageSettings
