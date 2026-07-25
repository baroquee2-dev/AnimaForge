import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

import HeaderTitle from '@components/views/HeaderTitle'
import { Theme } from '@lib/theme/ThemeManager'

import CharacterSettings from './CharacterSettings'
import ChatLayoutSettings from './ChatLayoutSettings'
import ChatSettings from './ChatSettings'
import ChatWindowSettings from './ChatWindowSettings'
import DatabaseSettings from './DatabaseSettings'
import GeneratingSettings from './GeneratingSettings'
import LanguageSettings from './LanguageSettings'
import NotificationSettings from './NotificationSettings'
import ScreenSettings from './ScreenSettings'
import SecuritySettings from './SecuritySettings'
import StyleSettings from './StyleSettings'

const AppSettingsMenu = () => {
    const { spacing } = Theme.useTheme()
    const { t } = useTranslation()

    return (
        <KeyboardAwareScrollView
            style={{
                marginVertical: spacing.xl2,
                paddingHorizontal: spacing.xl2,
                paddingBottom: spacing.xl3,
            }}
            contentContainerStyle={{ rowGap: spacing.sm }}>
            <HeaderTitle title={t('settings.title')} />

            <LanguageSettings />
            <ChatLayoutSettings />
            <StyleSettings />
            <ChatSettings />
            <ChatWindowSettings />
            <CharacterSettings />
            <GeneratingSettings />
            <NotificationSettings />
            <ScreenSettings />
            <DatabaseSettings />
            <SecuritySettings />

            <View style={{ paddingVertical: spacing.xl3 }} />
        </KeyboardAwareScrollView>
    )
}

export default AppSettingsMenu
