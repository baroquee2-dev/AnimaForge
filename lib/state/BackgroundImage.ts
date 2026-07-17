import { Asset } from 'expo-asset'
import { getDocumentAsync } from 'expo-document-picker'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage } from '@lib/storage/MMKV'
import { AppDirectory, copyFile, deleteFile, fileExists } from '@lib/utils/File'

import { Logger } from './Logger'

export const DEFAULT_CHAT_BACKGROUND_FILENAME = 'default-chat-background.png'
const LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME = 'default-chat-background.webp'

type BackgroundImageStateProps = {
    image?: string
    importImage: () => void
    removeImage: () => void
}

export const useBackgroundStore = create<BackgroundImageStateProps>()(
    persist(
        (set, get) => ({
            image: undefined,

            importImage: async () => {
                try {
                    const result = await getDocumentAsync({
                        copyToCacheDirectory: true,
                        type: 'image/*',
                    })
                    if (result.canceled) return
                    const uri = result.assets[0].uri
                    const name = result.assets[0].name
                    copyFile({ from: uri, to: AppDirectory.Assets + name })

                    set({ image: name })
                    Logger.infoToast('Successfully Imported!')
                } catch (e) {
                    Logger.error('Something went wrong with importing: ' + e)
                }
            },
            removeImage: () => {
                const imageName = get().image
                if (imageName) deleteFile(AppDirectory.Assets + imageName)
                set({ image: undefined })
                Logger.warnToast('Background Deleted!')
            },
        }),
        {
            name: Storage.BackgroundImage,
            partialize: (state) => ({ image: state.image }),
            storage: createMMKVStorage(),
            version: 1,
        }
    )
)

export const installDefaultChatBackground = async () => {
    const current = useBackgroundStore.getState().image
    const isLegacyDefault = current === LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME
    const isCurrentDefault = current === DEFAULT_CHAT_BACKGROUND_FILENAME
    if (current && !isLegacyDefault && !isCurrentDefault) return

    if (isLegacyDefault) deleteFile(AppDirectory.Assets + LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME)

    const dest = AppDirectory.Assets + DEFAULT_CHAT_BACKGROUND_FILENAME
    if (!fileExists(dest)) {
        try {
            const [asset] = await Asset.loadAsync(
                require('@assets/images/default-chat-background.png')
            )
            if (asset.localUri) await copyFile({ from: asset.localUri, to: dest })
        } catch (e) {
            Logger.error('Failed to install default chat background: ' + e)
            return
        }
    }

    useBackgroundStore.setState({ image: DEFAULT_CHAT_BACKGROUND_FILENAME })
}
