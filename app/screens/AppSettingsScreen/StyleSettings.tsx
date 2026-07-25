import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { hasCustomGlobalBackground, useBackgroundStore } from '@lib/state/BackgroundImage'

const StyleSettings = () => {
    const { t } = useTranslation()
    const router = useRouter()

    const { chatBackground, importBackground, deleteBackground } = useBackgroundStore(
        useShallow((state) => ({
            chatBackground: state.image,
            importBackground: state.importImage,
            deleteBackground: state.removeImage,
        }))
    )

    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>{t('settings.style.title')}</SectionTitle>

            <ThemedButton
                label={t('settings.style.changeTheme')}
                variant="secondary"
                onPress={() => router.push('/screens/AppSettingsScreen/ColorSelector')}
            />
            <ThemedButton
                label={t('settings.style.chatStyle')}
                variant="secondary"
                onPress={() => router.push('/screens/AppSettingsScreen/ChatStyleSettings')}
            />
            <ThemedButton
                label={t('settings.style.changeBackground')}
                variant="secondary"
                onPress={importBackground}
            />
            {hasCustomGlobalBackground(chatBackground) && (
                <ThemedButton
                    label={t('settings.style.removeBackground')}
                    variant="critical"
                    onPress={() =>
                        Alert.alert({
                            title: t('settings.style.removeBackgroundTitle'),
                            description: t('settings.style.removeBackgroundDesc'),
                            buttons: [
                                { label: t('common.cancel') },
                                {
                                    label: t('settings.style.removeBackground'),
                                    type: 'warning',
                                    onPress: deleteBackground,
                                },
                            ],
                        })
                    }
                />
            )}
        </View>
    )
}

export default StyleSettings
