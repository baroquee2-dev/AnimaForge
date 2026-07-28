import { getDocumentAsync } from 'expo-document-picker'
import { Image } from 'react-native'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@lib/i18n'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage } from '@lib/storage/MMKV'
import {
    AppDirectory,
    copyFile,
    deleteFile,
    fileExists,
    resolveBundledAssetFileUri,
} from '@lib/utils/File'

import { Characters } from './Characters'
import { Logger } from './Logger'

export const DEFAULT_CHAT_BACKGROUND_FILENAME = 'default-chat-background.png'
const LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME = 'default-chat-background.webp'

const bundledDefaultBackground = Image.resolveAssetSource(
    require('@assets/images/default-chat-background.png')
)

export const getBundledDefaultBackgroundUri = () => bundledDefaultBackground.uri

const isDefaultBackgroundFilename = (filename?: string) =>
    filename === DEFAULT_CHAT_BACKGROUND_FILENAME ||
    filename === LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME

export const hasCustomGlobalBackground = (filename?: string) =>
    !!filename && !isDefaultBackgroundFilename(filename)

export const resolveGlobalBackgroundUri = (imageName?: string) => {
    if (imageName) {
        const path = AppDirectory.Assets + imageName
        if (fileExists(path)) return path
        if (isDefaultBackgroundFilename(imageName)) return getBundledDefaultBackgroundUri()
        return ''
    }
    return getBundledDefaultBackgroundUri()
}

export const resolveChatBackgroundUri = (
    characterBackgroundId?: number | null,
    globalImageName?: string
) => {
    if (characterBackgroundId) {
        return Characters.getImageDir(characterBackgroundId)
    }
    return resolveGlobalBackgroundUri(globalImageName)
}

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
                    Logger.infoToast(i18n.t('toast.defaultBgUpdated'))
                } catch (e) {
                    Logger.error('Something went wrong with importing: ' + e)
                }
            },
            removeImage: () => {
                const imageName = get().image
                if (imageName && !isDefaultBackgroundFilename(imageName)) {
                    deleteFile(AppDirectory.Assets + imageName)
                }
                set({ image: undefined })
                Logger.warnToast(i18n.t('toast.defaultBgRestored'))
            },
        }),
        {
            name: Storage.BackgroundImage,
            partialize: (state) => ({ image: state.image }),
            storage: createMMKVStorage(),
            version: 1,
            onRehydrateStorage: () => (_state, error) => {
                if (!error) void installDefaultChatBackground()
            },
        }
    )
)

export const installDefaultChatBackground = async () => {
    const current = useBackgroundStore.getState().image
    if (current && !isDefaultBackgroundFilename(current)) return

    if (current === LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME) {
        deleteFile(AppDirectory.Assets + LEGACY_DEFAULT_CHAT_BACKGROUND_FILENAME)
    }

    const dest = AppDirectory.Assets + DEFAULT_CHAT_BACKGROUND_FILENAME
    if (!fileExists(dest)) {
        try {
            const localUri = await resolveBundledAssetFileUri(
                require('@assets/images/default-chat-background.png')
            )
            if (!localUri) {
                Logger.error('Failed to resolve default chat background asset URI')
            } else {
                const copied = await copyFile({ from: localUri, to: dest })
                if (!copied) {
                    Logger.error('Failed to copy default chat background to app storage')
                }
            }
        } catch (e) {
            Logger.error('Failed to install default chat background: ' + e)
        }
    }

    useBackgroundStore.setState({ image: DEFAULT_CHAT_BACKGROUND_FILENAME })
}
