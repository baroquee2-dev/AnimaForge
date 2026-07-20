import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { hasCustomGlobalBackground, useBackgroundStore } from '@lib/state/BackgroundImage'

const StyleSettings = () => {
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
            <SectionTitle>Style</SectionTitle>

            <ThemedButton
                label="Change Theme"
                variant="secondary"
                onPress={() => router.push('/screens/AppSettingsScreen/ColorSelector')}
            />
            <ThemedButton
                label="Change Default Background"
                variant="secondary"
                onPress={importBackground}
            />
            {hasCustomGlobalBackground(chatBackground) && (
                <ThemedButton
                    label="Remove Default Background"
                    variant="critical"
                    onPress={() =>
                        Alert.alert({
                            title: 'Remove Default Background?',
                            description:
                                'This removes your custom background and restores the built-in default.',
                            buttons: [
                                { label: 'Cancel' },
                                {
                                    label: 'Remove Default Background',
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
