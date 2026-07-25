import { Stack, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

import HeartbeatButton from '@components/buttons/HeartbeatButton'
import ThemedButton from '@components/buttons/ThemedButton'
import ThemedSwitch from '@components/input/ThemedSwitch'
import DropdownSheet from '@components/input/DropdownSheet'
import MultiDropdownSheet from '@components/input/MultiDropdownSheet'
import ThemedTextInput from '@components/input/ThemedTextInput'
import { CLAUDE_VERSION } from '@lib/constants/GlobalValues'
import { APIManagerValue, APIManager } from '@lib/engine/API/APIManagerState'
import { Logger } from '@lib/state/Logger'
import i18n from '@lib/i18n'
import { Theme } from '@lib/theme/ThemeManager'
import { getNestedValue } from '@lib/utils/Parsing'

const AddConnection = () => {
    const { t } = useTranslation()
    const styles = useStyles()
    const router = useRouter()
    const { addValue, getTemplates } = APIManager.useConnectionsStore(
        useShallow((state) => ({
            getTemplates: state.getTemplates,
            addValue: state.addValue,
        }))
    )

    const [template, setTemplate] = useState(getTemplates()[0])
    const [values, setValues] = useState<APIManagerValue>({
        ...template.defaultValues,
        configName: template.name,
        friendlyName: i18n.t('api.newApi'),
        active: true,
    })
    const [modelList, setModelList] = useState<any[]>([])

    const handleGetModelList = useCallback(async () => {
        if (!template.features.useModel) return

        const auth: any = {}
        if (template.features.useKey) {
            auth[template.request.authHeader] = template.request.authPrefix + values.key
            if (template.name === 'Claude') {
                auth['anthropic-version'] = CLAUDE_VERSION
            }
        }
        const result = await fetch(values.modelEndpoint, { headers: { ...auth } })
        const data = await result.json()
        if (result.status !== 200) {
            Logger.error(`Could not retrieve models: ${data?.error?.message}`)
            return
        }
        const models = getNestedValue(data, template.model.modelListParser)
        const isArray = Array.isArray(models)
        if (!models || !isArray) {
            Logger.warn('Could not parse models!')
            if (!models) {
                Logger.error('Models resulted in an undefined value')
            } else if (!isArray)
                Logger.error(
                    'Models resulted in an non-array value. `modelListParser` of template is likely incorrect'
                )
            return
        }
        setModelList(models)
    }, [template, values])

    useEffect(() => {
        handleGetModelList()
    }, [template, handleGetModelList])

    return (
        <SafeAreaView edges={['bottom']} style={styles.mainContainer}>
            <Stack.Screen options={{ title: t('api.addConnection') }} />
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ rowGap: 16, paddingBottom: 24 }}>
                <DropdownSheet
                    style={{ marginBottom: 8 }}
                    data={getTemplates()}
                    labelExtractor={(template) => template.name}
                    selected={template}
                    onChangeValue={(item) => {
                        setTemplate(item)
                        setModelList([])
                        setValues({
                            ...item.defaultValues,
                            friendlyName: values.friendlyName,
                            active: true,
                            configName: item.name,
                            model: undefined,
                        })
                    }}
                    modalTitle={t('api.selectType')}
                    search
                />

                <ThemedTextInput
                    label={t('api.friendlyName')}
                    value={values.friendlyName}
                    onChangeText={(value) => {
                        setValues({ ...values, friendlyName: value })
                    }}
                />

                {template.ui.editableCompletionPath && (
                    <View>
                        <ThemedTextInput
                            label={t('api.completionUrl')}
                            value={values.endpoint}
                            onChangeText={(value) => {
                                setValues({ ...values, endpoint: value })
                            }}
                        />
                        <Text style={styles.hintText}>{t('api.fullUrlNote')}</Text>
                    </View>
                )}

                {template.ui.editableModelPath && (
                    <View>
                        <ThemedTextInput
                            label={t('api.modelUrl')}
                            value={values.modelEndpoint}
                            onChangeText={(value) => {
                                setValues({ ...values, modelEndpoint: value })
                            }}
                        />
                        <HeartbeatButton
                            api={values.modelEndpoint ?? ''}
                            apiFormat={(s) => s}
                            headers={
                                template.features.useKey
                                    ? {
                                          [template.request.authHeader]:
                                              template.request.authPrefix + values.key,
                                      }
                                    : {}
                            }
                            callback={handleGetModelList}
                        />
                    </View>
                )}

                {template.features.useKey && (
                    <ThemedTextInput
                        label={t('api.apiKey')}
                        secureTextEntry
                        value={values.key}
                        onChangeText={(value) => {
                            setValues({ ...values, key: value })
                        }}
                    />
                )}

                {template.features.useModel && (
                    <View>
                        <Text style={styles.title}>{t('api.model')}</Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                columnGap: 8,
                                marginTop: 8,
                            }}>
                            {!template.features.multipleModels && (
                                <DropdownSheet
                                    containerStyle={{ flex: 1 }}
                                    selected={values.model}
                                    data={modelList}
                                    labelExtractor={(value) => {
                                        return getNestedValue(value, template.model.nameParser)
                                    }}
                                    onChangeValue={(item) => {
                                        setValues({ ...values, model: item })
                                    }}
                                    search={modelList.length > 10}
                                    modalTitle={t('api.selectModel')}
                                />
                            )}
                            {template.features.multipleModels && (
                                <MultiDropdownSheet
                                    containerStyle={{ flex: 1 }}
                                    selected={values?.model ?? []}
                                    data={modelList}
                                    labelExtractor={(value) => {
                                        return getNestedValue(value, template.model.nameParser)
                                    }}
                                    onChangeValue={(item) => {
                                        setValues({ ...values, model: item })
                                    }}
                                    search={modelList.length > 10}
                                    modalTitle={t('api.selectModel')}
                                />
                            )}
                            <ThemedButton
                                onPress={() => {
                                    handleGetModelList()
                                }}
                                iconName="reload"
                                iconSize={18}
                                variant="secondary"
                            />
                        </View>
                    </View>
                )}

                {template.features.useFirstMessage && (
                    <View>
                        <ThemedTextInput
                            label={t('api.firstMessage')}
                            value={values.firstMessage}
                            onChangeText={(value) => {
                                setValues({ ...values, firstMessage: value })
                            }}
                        />
                        <Text style={styles.hintText}>{t('api.firstMessageDesc')}</Text>
                    </View>
                )}
                {template.features.usePrefill && (
                    <View>
                        <ThemedTextInput
                            label={t('api.prefill')}
                            value={values.prefill}
                            onChangeText={(value) => {
                                setValues({ ...values, prefill: value })
                            }}
                        />
                        <Text style={styles.hintText}>{t('api.prefillDesc')}</Text>
                    </View>
                )}

                {template.features.useGeminiGrounding && (
                    <ThemedSwitch
                        label={t('api.searchGrounding')}
                        value={values.geminiSearchGrounding ?? false}
                        onChangeValue={(enabled) => {
                            setValues({ ...values, geminiSearchGrounding: enabled })
                        }}
                        description={t('api.searchGroundingDesc')}
                    />
                )}
            </ScrollView>
            <ThemedButton
                label={t('api.createApi')}
                onPress={() => {
                    addValue(values)
                    router.back()
                }}
            />
        </SafeAreaView>
    )
}

export default AddConnection

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        mainContainer: {
            marginVertical: spacing.xl,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.xl,
            flex: 1,
        },

        title: {
            paddingTop: spacing.m,
            color: color.text._100,
            fontSize: spacing.xl,
        },

        hintText: {
            marginTop: spacing.s,
            color: color.text._400,
        },

        modelInfo: {
            borderRadius: spacing.m,
            backgroundColor: color.neutral._200,
            flex: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.l,
            paddingBottom: spacing.xl2,
        },
    })
}
