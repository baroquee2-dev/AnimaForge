import { localDownload } from '@vali98/react-native-fs'
import { Asset } from 'expo-asset'
import { getDocumentAsync } from 'expo-document-picker'
import { Directory, File, Paths } from 'expo-file-system'

import { Logger } from '../state/Logger'

export const AppDirectory = {
    ModelPath: `${Paths.document.uri}models/`,
    SessionPath: `${Paths.document.uri}session/`,
    CharacterPath: `${Paths.document.uri}characters/`,
    Assets: `${Paths.document.uri}appAssets/`,
    Attachments: `${Paths.document.uri}attachments/`,
}

export namespace FileUtils {
    export const pickText = async (params: { type?: string } = {}): Promise<PickerResult> => {
        return pickFile(async (file) => {
            return await file.text()
        }, params)
    }

    const pickFile = async (
        fileReader: (file: File) => Promise<string>,
        { type = '*/*' }: { type?: string } = {}
    ): Promise<PickerResult> => {
        const result = await getDocumentAsync({ type: type })
        if (result.canceled) {
            return { success: false }
        }
        const [asset] = result.assets
        const file = new File(asset.uri)
        let data = await fileReader(file)
        if (!data) {
            return { success: false }
        }
        return { success: true, data: data }
    }
}

export const saveStringToDownload = async (
    data: string,
    filename: string,
    encoding: 'base64' | `utf8`
) => {
    new File(Paths.cache, filename).write(data, { encoding })
    await localDownload((Paths.cache.uri + filename).replace('file://', '')).catch((e) =>
        Logger.error('Failed to download: ' + e)
    )
}

type PickerResult = { success: false } | { success: true; data: string }

type JSONPickerResult = { success: false } | { success: true; data: any }

/**@deprecated */
export const pickJSONDocument = async (): Promise<JSONPickerResult> => {
    const result = await pickStringDocument({ type: 'application/json' })
    if (!result.success) return result
    try {
        const jsonData = JSON.parse(result.data)
        return { success: true, data: jsonData }
    } catch {
        return { success: false }
    }
}

/**@deprecated */
export const pickStringDocument = async ({
    encoding = 'utf8',
    type = '*/*',
}: {
    encoding?: 'utf8' | 'base64'
    type?: string
} = {}): Promise<PickerResult> => {
    const result = await getDocumentAsync({ type: type })
    if (result.canceled) {
        return { success: false }
    }
    const uri = result.assets[0].uri
    const file = new File(uri)
    let data = ''
    if (encoding === 'utf8') data = await file.text()
    else data = await file.base64()

    if (!data) {
        return { success: false }
    }
    return { success: true, data: data }
}

const gb = 1000 ** 3
const mb = 1000 ** 2

/**
 * Gets a human friendly version of file size
 * @param size size in bytes
 * @returns string containing readable file size
 */
export const readableFileSize = (size: number) => {
    if (size < gb) {
        const sizeInMB = size / mb
        return `${sizeInMB.toFixed(2)} MB`
    } else {
        const sizeInGB = size / gb
        return `${sizeInGB.toFixed(2)} GB`
    }
}

export const listFiles = (path: string) => {
    return new Directory(path)
        .listAsRecords()
        .filter((item) => !item.isDirectory)
        .map((item) => {
            const uri = item.uri.endsWith('/') ? item.uri.slice(0, -1) : item.uri
            return uri.slice(uri.lastIndexOf('/') + 1)
        })
        .filter((item): item is string => !!item)
}

export const fileExists = (path: string) => {
    return new File(path).exists
}

export const copyFile = async ({ from, to }: { from: string; to: string }) => {
    try {
        await new File(from).copy(new File(to))
        return true
    } catch (e) {
        Logger.error('Failed to copy: ' + e)
        return false
    }
}

/**
 * Resolve a bundled Asset module to a real file:// URI.
 * On Android release builds, image assets are marked downloaded with a drawable
 * resource name (not an absolute URI), which breaks File.copy / base64.
 */
export const resolveBundledAssetFileUri = async (moduleId: number): Promise<string | null> => {
    const [asset] = await Asset.loadAsync(moduleId)
    if (asset.downloaded && asset.localUri && !asset.localUri.includes(':')) {
        asset.downloaded = false
    }
    if (!asset.localUri?.includes(':')) {
        await asset.downloadAsync()
    }
    if (!asset.localUri?.startsWith('file')) {
        Logger.error(`Bundled asset did not resolve to a file URI: ${asset.localUri ?? 'null'}`)
        return null
    }
    return asset.localUri
}

export const deleteFile = (path: string) => {
    try {
        const file = new File(path)
        if (file.exists) file.delete()
        return true
    } catch (e) {
        Logger.error('Failed to delete: ' + e)
        return false
    }
}

export const readBase64Async = async (path: string) => {
    return await new File(path).base64()
}

export const readStringAsync = async (path: string) => {
    return await new File(path).text()
}

export const writeBase64File = async (path: string, content: string) => {
    return await new File(path).write(content, { encoding: 'base64' })
}

export const fileInfo = (path: string) => {
    return new File(path).info()
}

export const makeDirectory = async (path: string) => {
    new Directory(path).create({ idempotent: true })
}
