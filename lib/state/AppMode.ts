import { useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import Alert from '@components/views/Alert'
import { Llama } from '@lib/engine/Local/LlamaLocal'
import { Storage } from '@lib/enums/Storage'
import i18n from '@lib/i18n'
import { createMMKVStorage } from '@lib/storage/MMKV'

type AppMode = 'local' | 'remote'

type AppModeStateProps = {
    appMode: AppMode
    setAppMode: (mode: AppMode) => void
}

export const useAppModeStore = create<AppModeStateProps>()(
    persist(
        (set) => ({
            appMode: 'local',
            setAppMode: (mode) => {
                set({ appMode: mode })
            },
        }),
        {
            name: Storage.AppMode,
            storage: createMMKVStorage(),
            partialize: (state) => ({ appMode: state.appMode }),
            version: 1,
        }
    )
)

export const useAppMode = () => {
    const { appMode, setAppMode: setAppModeInternal } = useAppModeStore(
        useShallow((state) => ({
            appMode: state.appMode,
            setAppMode: state.setAppMode,
        }))
    )
    const { context, unload } = Llama.useLlamaModelStore()

    const setAppMode = useCallback(
        (mode: AppMode) => {
            if (!!context && mode === 'remote') {
                Alert.alert({
                    title: i18n.t('appMode.modelLoadedTitle'),
                    description: i18n.t('appMode.modelLoadedDesc'),
                    buttons: [
                        {
                            label: i18n.t('appMode.swapAnyways'),
                            onPress: async () => {
                                setAppModeInternal(mode)
                            },
                            type: 'warning',
                        },
                        { label: i18n.t('common.cancel') },
                        {
                            label: i18n.t('common.unload'),
                            onPress: async () => {
                                await unload()
                                setAppModeInternal(mode)
                            },
                        },
                    ],
                })
            } else {
                setAppModeInternal(mode)
            }
        },
        [context, setAppModeInternal, unload]
    )

    return { appMode, setAppMode }
}
