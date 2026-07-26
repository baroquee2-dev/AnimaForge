import { reloadAppAsync } from 'expo'
import { getDocumentAsync } from 'expo-document-picker'
import React from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import ThemedButton from '@components/buttons/ThemedButton'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import i18n from '@lib/i18n'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { exportAppBackup, importAppBackup } from '@lib/utils/Backup'
import appConfig from 'app.config'

const appVersion = appConfig.expo.version

const exportDB = async (notify: boolean = true) => {
    try {
        await exportAppBackup(appVersion)
        if (notify) Logger.infoToast(i18n.t('settings.database.downloadSuccess'))
    } catch (e) {
        Logger.errorToast(i18n.t('settings.database.copyFailed', { error: e }))
    }
}

const importDB = async (uri: string, name: string) => {
    const copyDB = async () => {
        try {
            await importAppBackup(uri, name)
            reloadAppAsync()
        } catch (e) {
            Logger.errorToast(i18n.t('settings.database.copyFailed', { error: e }))
        }
    }

    const dbAppVersion = name.split('-')?.[0]
    if (dbAppVersion !== appVersion) {
        Alert.alert({
            title: i18n.t('settings.database.versionWarningTitle'),
            description: i18n.t('settings.database.versionWarningDesc', {
                dbVersion: dbAppVersion,
                appVersion,
            }),
            buttons: [
                { label: i18n.t('common.cancel') },
                {
                    label: i18n.t('settings.database.importAnyways'),
                    onPress: copyDB,
                    type: 'warning',
                },
            ],
        })
    } else copyDB()
}

const DatabaseSettings = () => {
    const { t } = useTranslation()
    const { color, spacing } = Theme.useTheme()
    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>{t('settings.database.title')}</SectionTitle>

            <Text
                style={{
                    color: color.text._500,
                    paddingBottom: spacing.xs,
                    marginBottom: spacing.m,
                }}>
                {t('settings.database.warning')}
            </Text>
            <ThemedButton
                label={t('settings.database.export')}
                variant="secondary"
                onPress={() => {
                    Alert.alert({
                        title: t('settings.database.exportTitle'),
                        description: t('settings.database.exportDesc'),
                        buttons: [
                            { label: t('common.cancel') },
                            { label: t('settings.database.export'), onPress: exportDB },
                        ],
                    })
                }}
            />

            <ThemedButton
                label={t('settings.database.import')}
                variant="secondary"
                onPress={async () => {
                    getDocumentAsync({
                        type: ['application/zip', 'application/x-zip-compressed', 'application/*'],
                    }).then(async (result) => {
                        if (result.canceled) return
                        Alert.alert({
                            title: t('settings.database.importTitle'),
                            description: t('settings.database.importDesc'),
                            buttons: [
                                { label: t('common.cancel') },
                                {
                                    label: t('common.import'),
                                    onPress: () =>
                                        importDB(result.assets[0].uri, result.assets[0].name),
                                    type: 'warning',
                                },
                            ],
                        })
                    })
                }}
            />
        </View>
    )
}

export default DatabaseSettings
