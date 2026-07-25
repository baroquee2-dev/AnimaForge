import * as KeepAwake from 'expo-keep-awake'
import React from 'react'
import { View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useTranslation } from 'react-i18next'

import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { registerForPushNotificationsAsync } from '@lib/notifications/Notifications'

const GeneratingSettings = () => {
    const { t } = useTranslation()
    const [printContext, setPrintContext] = useMMKVBoolean(AppSettings.PrintContext)
    const [bypassContextLength, setBypassContextLength] = useMMKVBoolean(
        AppSettings.BypassContextLength
    )
    const [notificationOnGenerate, setNotificationOnGenerate] = useMMKVBoolean(
        AppSettings.NotifyOnComplete
    )
    const [notificationSound, setNotificationSound] = useMMKVBoolean(
        AppSettings.PlayNotificationSound
    )
    const [notificationVibrate, setNotificationVibrate] = useMMKVBoolean(
        AppSettings.VibrateNotification
    )
    const [showNotificationText, setShowNotificationText] = useMMKVBoolean(
        AppSettings.ShowNotificationText
    )
    const [keepAwake, setKeepAwake] = useMMKVBoolean(AppSettings.KeepAwake)
    const [authLocal, setAuthLocal] = useMMKVBoolean(AppSettings.LocallyAuthenticateUser)

    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>{t('settings.generation.title')}</SectionTitle>

            <ThemedSwitch
                label={t('settings.generation.printContext')}
                value={printContext}
                onChangeValue={setPrintContext}
                description={t('settings.generation.printContextDesc')}
            />

            <ThemedSwitch
                label={t('settings.generation.bypassContext')}
                value={bypassContextLength}
                onChangeValue={setBypassContextLength}
                description={t('settings.generation.bypassContextDesc')}
            />

            <ThemedSwitch
                label={t('settings.notifications.enable')}
                value={notificationOnGenerate}
                onChangeValue={async (value) => {
                    if (!value) {
                        setNotificationOnGenerate(false)
                        return
                    }

                    const granted = await registerForPushNotificationsAsync()
                    if (granted) {
                        setNotificationOnGenerate(true)
                    }
                }}
                description={t('settings.notifications.enableDesc')}
            />
            {notificationOnGenerate && (
                <View>
                    <ThemedSwitch
                        label={t('settings.notifications.sound')}
                        value={notificationSound}
                        onChangeValue={setNotificationSound}
                        description=""
                    />

                    <ThemedSwitch
                        label={t('settings.notifications.vibrate')}
                        value={notificationVibrate}
                        onChangeValue={setNotificationVibrate}
                        description=""
                    />

                    <ThemedSwitch
                        label={t('settings.notifications.showText')}
                        value={showNotificationText}
                        onChangeValue={setShowNotificationText}
                        description={t('settings.notifications.showTextDesc')}
                    />
                </View>
            )}

            <ThemedSwitch
                label={t('settings.screen.keepAwake')}
                description={t('settings.screen.keepAwakeDesc')}
                value={keepAwake}
                onChangeValue={(value) => {
                    setKeepAwake(value)
                    if (value) KeepAwake.activateKeepAwakeAsync()
                    else KeepAwake.deactivateKeepAwake()
                }}
            />

            <ThemedSwitch
                label={t('settings.security.lockApp')}
                value={authLocal}
                onChangeValue={setAuthLocal}
                description={t('settings.security.lockAppDesc')}
            />
        </View>
    )
}

export default GeneratingSettings
