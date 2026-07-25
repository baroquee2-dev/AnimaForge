import React from 'react'
import { View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useTranslation } from 'react-i18next'

import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import { AppSettings } from '@lib/constants/GlobalValues'

const ChatSettings = () => {
    const { t } = useTranslation()
    const [firstMes, setFirstMes] = useMMKVBoolean(AppSettings.CreateFirstMes)
    const [chatOnStartup, setChatOnStartup] = useMMKVBoolean(AppSettings.ChatOnStartup)
    const [autoLoadUser, setAutoLoadUser] = useMMKVBoolean(AppSettings.AutoLoadUser)
    const [autoTitle, setAutoTitle] = useMMKVBoolean(AppSettings.AutoGenerateTitle)
    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>{t('settings.chat.title')}</SectionTitle>

            <ThemedSwitch
                label={t('settings.chat.useFirstMessage')}
                value={firstMes}
                onChangeValue={setFirstMes}
                description={t('settings.chat.useFirstMessageDesc')}
            />

            <ThemedSwitch
                label={t('settings.chat.loadOnStartup')}
                value={chatOnStartup}
                onChangeValue={setChatOnStartup}
                description={t('settings.chat.loadOnStartupDesc')}
            />

            <ThemedSwitch
                label={t('settings.chat.autoLoadUser')}
                value={autoLoadUser}
                onChangeValue={setAutoLoadUser}
                description={t('settings.chat.autoLoadUserDesc')}
            />

            <ThemedSwitch
                label={t('settings.chat.autoTitle')}
                value={autoTitle}
                onChangeValue={setAutoTitle}
                description={t('settings.chat.autoTitleDesc')}
            />
        </View>
    )
}

export default ChatSettings
