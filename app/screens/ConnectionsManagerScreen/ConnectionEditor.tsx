import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import HeartbeatButton from '@components/buttons/HeartbeatButton'
import ThemedButton from '@components/buttons/ThemedButton'
import ThemedSwitch from '@components/input/ThemedSwitch'
import DropdownSheet from '@components/input/DropdownSheet'
import MultiDropdownSheet from '@components/input/MultiDropdownSheet'
import ThemedTextInput from '@components/input/ThemedTextInput'
import Alert from '@components/views/Alert'
import BottomSheet from '@components/views/BottomSheet'
import { CLAUDE_VERSION } from '@lib/constants/GlobalValues'
import { APIValues } from '@lib/engine/API/APIBuilder.types'
import { APIManager, APIManagerValue } from '@lib/engine/API/APIManagerState'
import { useDebounce } from '@lib/hooks/Debounce'
import i18n from '@lib/i18n'
import { LiteLLMModels } from '@lib/state/LiteLLMModels'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { getNestedValue } from '@lib/utils/Parsing'

type ConnectionEditorProps = {
    index: number
    show: boolean
    close: () => void
    originalValues: APIManagerValue
}

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
    index,
    show,
    close,
    originalValues,
}) => {
    const { t } = useTranslation()
    const { color, fontSize } = Theme.useTheme()
    const styles = useStyles()

    const { editValue, getTemplates, addValue, removeValue } = APIManager.useConnectionsStore(
        useShallow((state) => ({
            getTemplates: state.getTemplates,
            editValue: state.editValue,
            addValue: state.addValue,
            removeValue: state.removeValue,
        }))
    )

    const [values, setValues] = useState<APIManagerValue>(originalValues)
    const [modelList, setModelList] = useState<any[]>([])

    const template = useMemo(() => {
        const match = getTemplates().find((item) => item.name === values.configName)
        if (!match) {
            Logger.errorToast(i18n.t('api.invalidTemplate'))
            close()
            return getTemplates()[0]
        }
        return match
    }, [close, getTemplates, values.configName])

    const selectedModelValue =
        values.model && !Array.isArray(values.model)
            ? getNestedValue(values.model, template.model.nameParser)
            : undefined
    const selectedModelName =
        typeof selectedModelValue === 'string' ? selectedModelValue : undefined
    const maxContextWindow = LiteLLMModels.useMaxContextWindow(template.name, selectedModelName)

    const handleGetModelList = useCallback(
        async (nextValues: APIValues) => {
            if (!template.features.useModel || !show) return
            const auth: any = {}
            if (template.features.useKey) {
                auth[template.request.authHeader] = template.request.authPrefix + nextValues.key
                if (template.name === 'Claude') {
                    auth['anthropic-version'] = CLAUDE_VERSION
                }
            }
            const result = await fetch(nextValues.modelEndpoint, { headers: { ...auth } })
            const data = await result.json()
            if (result.status !== 200) {
                Logger.error(`Could not retrieve models: ${data?.error?.message}`)
                return
            }
            const models = getNestedValue(data, template.model.modelListParser)
            setModelList(models)
        },
        [show, template]
    )

    const debouncedModelList = useDebounce(handleGetModelList, 300)

    useEffect(() => {
        if (!show) return
        setValues(originalValues)
    }, [show, originalValues])

    useEffect(() => {
        if (!show) return
        debouncedModelList(values)
    }, [debouncedModelList, show, values])

    const handleDelete = () => {
        Alert.alert({
            title: t('api.deleteConnection'),
            description: t('api.deleteDesc', { name: originalValues.friendlyName }),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('common.delete'),
                    type: 'warning',
                    onPress: () => {
                        removeValue(index)
                        close()
                    },
                },
            ],
        })
    }

    return (
        <BottomSheet
            sheetStyle={{ flex: 2, maxHeight: '80%' }}
            visible={show}
            onClose={close}
            setVisible={(v) => {
                if (v) return
                close()
            }}>
            <View style={styles.mainContainer}>
                <Text
                    style={{
                        color: color.text._100,
                        fontSize: fontSize.xl2,
                        fontWeight: '500',
                        paddingBottom: 16,
                    }}>
                    {t('api.editConnection')}
                </Text>

                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ rowGap: 12, paddingBottom: 32 }}>
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
                                callback={() => handleGetModelList(values)}
                            />
                        </View>
                    )}

                    {template.features.useKey && (
                        <ThemedTextInput
                            secureTextEntry
                            label={t('api.apiKey')}
                            value={values.key}
                            onChangeText={(value) => {
                                setValues({ ...values, key: value })
                            }}
                        />
                    )}

                    {template.features.useModel && (
                        <View style={{ rowGap: 4 }}>
                            <Text style={styles.title}>{t('api.model')}</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    columnGap: 8,
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
                                        handleGetModelList(values)
                                    }}
                                    iconName="reload"
                                    iconSize={18}
                                    variant="secondary"
                                />
                            </View>
                            {maxContextWindow && (
                                <Text numberOfLines={1} style={styles.hintText}>
                                    {t('api.maxContextWindowHint', {
                                        tokens: maxContextWindow.toLocaleString(),
                                    })}
                                </Text>
                            )}
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
                            <Text style={styles.hintText}>
                                {t('api.firstMessageDesc')}
                            </Text>
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
                <View
                    style={{
                        flexDirection: 'row',
                        paddingTop: 8,
                        justifyContent: 'space-between',
                        columnGap: 8,
                    }}>
                    <ThemedButton
                        variant="critical"
                        iconName="delete"
                        label={t('common.delete')}
                        onPress={handleDelete}
                    />
                    <ThemedButton
                        variant="tertiary"
                        iconName="copy"
                        label={t('common.clone')}
                        onPress={() => {
                            const newName = t('api.cloneSuffix', { name: values.friendlyName })
                            addValue({ ...values, friendlyName: newName })
                            close()
                        }}
                    />
                    <ThemedButton
                        label={t('api.saveChanges')}
                        onPress={() => {
                            editValue(values, index)
                            close()
                        }}
                    />
                </View>
            </View>
        </BottomSheet>
    )
}

export default ConnectionEditor

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        mainContainer: {
            flex: 1,
        },

        title: {
            color: color.text._100,
        },

        hintText: {
            paddingTop: spacing.s,
            color: color.text._400,
        },
    })
}
