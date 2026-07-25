import React from 'react'
import { View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useTranslation } from 'react-i18next'

import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { registerForPushNotificationsAsync } from '@lib/notifications/Notifications'

const NotificationSettings = () => {
    const { t } = useTranslation()
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

    return (
        <View>
            <SectionTitle>{t('settings.notifications.title')}</SectionTitle>
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
        </View>
    )
}

export default NotificationSettings
