import React, { useState } from 'react'
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}>
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

                    <Text style={styles.description}>
                        {t('about.descriptionPrefix')}
                        <Text style={styles.modeName}>{t('about.modeVisualNovel')}</Text>
                        {t('about.descriptionSep')}
                        <Text style={styles.modeName}>{t('about.modeImmersive')}</Text>
                        {t('about.descriptionAnd')}
                        <Text style={styles.modeName}>{t('about.modeMessenger')}</Text>
                        {t('about.descriptionSuffix')}
                    </Text>

                    <ThemedButton
                        buttonStyle={{ marginTop: spacing.xl2, alignSelf: 'stretch' }}
                        variant="secondary"
                        label={t('about.github')}
                        iconName="github"
                        iconSize={20}
                        onPress={() => {
                            Linking.openURL(GITHUB_REPOSITORY)
                        }}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('about.attributionBase')}</Text>
                    <Text style={styles.footerText}>{t('about.attributionLicense')}</Text>
                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => Linking.openURL(GITHUB_REPOSITORY)}>
                        <Text style={styles.footerLink}>{t('about.attributionMore')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

export default AboutScreen

const useStyles = () => {
    const { color, spacing, fontSize } = Theme.useTheme()

    return StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: spacing.xl2,
            paddingBottom: spacing.xl2,
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            width: '100%',
            maxWidth: 340,
            alignItems: 'center',
        },
        subtitleText: {
            color: color.text._400,
            marginTop: spacing.m,
            fontSize: fontSize.m,
        },
        description: {
            marginTop: spacing.xl,
            color: color.text._200,
            fontSize: fontSize.l,
            lineHeight: fontSize.l * 1.55,
            textAlign: 'center',
            fontWeight: '500',
        },
        modeName: {
            color: color.primary._400,
            fontWeight: '700',
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
            transform: [{ scale: 1.35 }],
        },
        footer: {
            width: '100%',
            maxWidth: 340,
            marginTop: spacing.xl3,
            paddingTop: spacing.l,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: color.neutral._400,
            alignItems: 'center',
            rowGap: 2,
        },
        footerText: {
            color: color.text._500,
            fontSize: fontSize.s,
            lineHeight: fontSize.s * 1.45,
            textAlign: 'center',
        },
        footerLink: {
            color: color.text._400,
            fontSize: fontSize.s,
            lineHeight: fontSize.s * 1.45,
            textAlign: 'center',
            marginTop: 2,
            opacity: 0.85,
        },
    })
}
