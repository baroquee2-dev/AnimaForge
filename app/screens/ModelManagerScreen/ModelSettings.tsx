import { useFocusEffect } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, Platform, View } from 'react-native'
import { useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv'
import Animated, { Easing, SlideInRight, SlideOutRight } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import HorizontalSelector from '@components/input/HorizontalSelector'
import ThemedSlider from '@components/input/ThemedSlider'
import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { AppSettings, Global } from '@lib/constants/GlobalValues'
import { Llama } from '@lib/engine/Local/LlamaLocal'
import { KV } from '@lib/engine/Local/Model'
import useBackendDevices from '@lib/hooks/BackendDevices'
import { Logger } from '@lib/state/Logger'
import { readableFileSize } from '@lib/utils/File'

type ModelSettingsProp = {
    modelImporting: boolean
    modelLoading: boolean
    exit: () => void
}

const deviceLabels = { GPUOpenCL: 'OpenCL', HTP0: 'Hexagon', CPU: 'CPU' }

const ModelSettings: React.FC<ModelSettingsProp> = ({ modelImporting, modelLoading, exit }) => {
    const { t } = useTranslation()
    const { config, setConfig } = Llama.useLlamaPreferencesStore(
        useShallow((state) => ({
            config: state.config,
            setConfig: state.setConfiguration,
        }))
    )

    const devices = useBackendDevices()

    const [saveKV, setSaveKV] = useMMKVBoolean(AppSettings.SaveLocalKV)
    const [autoloadLocal, setAutoloadLocal] = useMMKVBoolean(AppSettings.AutoLoadLocal)
    const [showModelInChat, setShowModelInChat] = useMMKVBoolean(AppSettings.ShowModelInChat)
    const [threadCount] = useMMKVNumber(Global.CPUThreads)

    const [kvSize, setKVSize] = useState(0)

    const getKVSize = async () => {
        const size = await KV.getKVSize()
        setKVSize(size)
    }

    useEffect(() => {
        getKVSize()
    }, [])

    const backAction = () => {
        exit()
        return true
    }

    useFocusEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', backAction)
        return () => handler.remove()
    })

    const handleDeleteKV = () => {
        Alert.alert({
            title: t('models.deleteKvTitle'),
            description: t('models.deleteKvDesc', { size: readableFileSize(kvSize) }),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('models.deleteKvConfirm'),
                    onPress: async () => {
                        await KV.deleteKV()
                        Logger.info('KV Cache deleted!')
                        getKVSize()
                    },
                    type: 'warning',
                },
            ],
        })
    }

    return (
        <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            entering={SlideInRight.easing(Easing.inOut(Easing.cubic))}
            exiting={SlideOutRight.easing(Easing.inOut(Easing.cubic))}>
            <SectionTitle>{t('models.cpuSettings')}</SectionTitle>
            <View style={{ marginTop: 16 }} />
            {config && (
                <>
                    <ThemedSlider
                        label={t('models.maxContext')}
                        value={config.context_length}
                        onValueChange={(value) => setConfig({ ...config, context_length: value })}
                        min={1024}
                        max={32768}
                        step={1024}
                        disabled={modelImporting || modelLoading}
                    />
                    <ThemedSlider
                        label={t('models.threads')}
                        value={config.threads}
                        onValueChange={(value) => setConfig({ ...config, threads: value })}
                        min={1}
                        max={threadCount ?? 8}
                        step={1}
                        disabled={modelImporting || modelLoading}
                    />

                    <ThemedSlider
                        label={t('models.batch')}
                        value={config.batch}
                        onValueChange={(value) => setConfig({ ...config, batch: value })}
                        min={16}
                        max={1024}
                        step={16}
                        disabled={modelImporting || modelLoading}
                    />

                    {/* Note: llama.rn does not have any Android gpu acceleration */}
                    {(Platform.OS === 'ios' || devices.length > 1) && (
                        <ThemedSlider
                            label={t('models.gpuLayers')}
                            value={config.gpu_layers}
                            onValueChange={(value) => setConfig({ ...config, gpu_layers: value })}
                            min={0}
                            max={100}
                            step={1}
                            disabled={modelImporting || modelLoading}
                        />
                    )}

                    <ThemedSwitch
                        label={t('models.contextShift')}
                        value={config.ctx_shift}
                        onChangeValue={(value) => {
                            setConfig({ ...config, ctx_shift: value })
                        }}
                    />

                    {devices.length > 1 && (
                        <HorizontalSelector
                            style={{ paddingBottom: 12 }}
                            label={t('models.backendDevice')}
                            values={devices.map((item) => ({
                                label: deviceLabels[item as keyof typeof deviceLabels] ?? item,
                                value: item,
                            }))}
                            selected={config.devices?.[0]}
                            onPress={(value) => {
                                const devices = value === 'CPU' ? [value] : [value, 'CPU']
                                setConfig({ ...config, devices })
                            }}
                        />
                    )}
                </>
            )}
            <SectionTitle>{t('models.advancedSettings')}</SectionTitle>
            <ThemedSwitch
                label={t('models.showNameInChat')}
                value={showModelInChat}
                onChangeValue={setShowModelInChat}
            />
            <ThemedSwitch
                label={t('models.autoLoadOnChat')}
                value={autoloadLocal}
                onChangeValue={setAutoloadLocal}
            />
            <ThemedSwitch
                label={t('models.saveLocalKv')}
                value={saveKV}
                onChangeValue={setSaveKV}
                description={saveKV ? '' : t('models.saveLocalKvDesc')}
            />
            {saveKV && (
                <ThemedButton
                    buttonStyle={{ marginTop: 8 }}
                    label={t('models.purgeKv', { size: readableFileSize(kvSize) })}
                    onPress={handleDeleteKV}
                    variant={kvSize === 0 ? 'disabled' : 'critical'}
                />
            )}
        </Animated.ScrollView>
    )
}

export default ModelSettings
