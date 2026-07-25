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
            <TouchableOpacity activeOpacity={0.8} onPress={updateCounter}>
                <View style={styles.iconFrame}>
                    <Image
                        source={require('../../assets/images/about-icon.png')}
                        style={styles.iconImage}
                        resizeMode="cover"
                    />
                </View>
            </TouchableOpacity>

            <View style={styles.titleRow}>
                <Text style={styles.titleAnima}>Anima</Text>
                <Text style={styles.titleForge}>Forge</Text>
            </View>
            <Text style={styles.subtitleText}>
                {t('about.version', { version })} {devMode && t('about.devMode')}
            </Text>
            {devMode && (
                <ThemedButton
                    label={t('about.disableDevMode')}
                    variant="critical"
                    buttonStyle={{
                        marginTop: spacing.xl,
                    }}
                    onPress={() => {
                        setCounter(0)
                        setDevMode(false)
                        Logger.info('Dev mode disabled')
                    }}
                />
            )}

            <ThemedButton
                buttonStyle={{ marginTop: spacing.xl3 }}
                variant="secondary"
                label={t('about.github')}
                iconName="github"
                iconSize={20}
                onPress={() => {
                    Linking.openURL(GITHUB_REPOSITORY)
                }}
            />
        </View>
    )
}

export default AboutScreen

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: spacing.xl3,
            paddingBottom: spacing.xl2,
            justifyContent: 'center',
            alignItems: 'center',
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            marginTop: spacing.m,
        },
        titleAnima: {
            fontSize: 32,
            fontWeight: '500',
            color: color.text._100,
        },
        titleForge: {
            fontSize: 32,
            fontWeight: '700',
            color: color.primary._500,
            marginLeft: spacing.sm,
        },
        subtitleText: { color: color.text._400, marginTop: spacing.sm },
        iconFrame: {
            width: 160,
            height: 160,
            borderRadius: 20,
            backgroundColor: '#000',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconImage: {
            width: '100%',
            height: '100%',
            transform: [{ scale: 1.4 }],
        },
    })
}
