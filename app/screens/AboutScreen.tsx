import React, { useState } from 'react'
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useTranslation } from 'react-i18next'

import ThemedButton from '@components/buttons/ThemedButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings, GITHUB_REPOSITORY } from '@lib/constants/GlobalValues'
import i18n from '@lib/i18n'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import appConfig from 'app.config'

const AboutScreen = () => {
    const { t } = useTranslation()
    const styles = useStyles()
    const { spacing } = Theme.useTheme()
    const [counter, setCounter] = useState<number>(0)
    const [devMode, setDevMode] = useMMKVBoolean(AppSettings.DevMode)

    const updateCounter = () => {
        if (devMode) return
        if (counter === 6) {
            Logger.infoToast(i18n.t('about.enabledDevMode'))
            setDevMode(true)
        }
        setCounter(counter + 1)
    }

    const version = 'v' + appConfig.expo.version
    return (
        <View style={styles.container}>
            <HeaderTitle title={t('about.title')} />
            <View style={styles.content}>
                <TouchableOpacity activeOpacity={0.8} onPress={updateCounter}>
                    <View style={styles.iconFrame}>
                        <Image
                            source={require('../../assets/images/about-icon.png')}
                            style={styles.iconImage}
                            resizeMode="contain"
                        />
                    </View>
                </TouchableOpacity>

                <Text style={styles.subtitleText}>
                    {t('about.version', { version })} {devMode && t('about.devMode')}
                </Text>
                {devMode && (
                    <ThemedButton
                        label={t('about.disableDevMode')}
                        variant="critical"
                        buttonStyle={{
                            marginTop: spacing.m,
                        }}
                        onPress={() => {
                            setCounter(0)
                            setDevMode(false)
                            Logger.info('Dev mode disabled')
                        }}
                    />
                )}

                <ThemedButton
                    buttonStyle={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
                    variant="secondary"
                    label={t('about.github')}
                    iconName="github"
                    iconSize={20}
                    onPress={() => {
                        Linking.openURL(GITHUB_REPOSITORY)
                    }}
                />
            </View>
        </View>
    )
}

export default AboutScreen

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: spacing.xl2,
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            width: '100%',
            maxWidth: 300,
            alignItems: 'center',
        },
        subtitleText: {
            color: color.text._400,
            marginTop: spacing.m,
        },
        iconFrame: {
            width: 210,
            height: 210,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconImage: {
            width: 210,
            height: 210,
            // Crop white padding baked into the logo PNG
            transform: [{ scale: 1.35 }],
        },
    })
}
