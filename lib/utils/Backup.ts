import { localDownload } from '@vali98/react-native-fs'
import { File, Paths } from 'expo-file-system'
import { unzipSync, zipSync } from 'fflate'

import {
    AppDirectory,
    copyFile,
    deleteFile,
    fileExists,
    listFiles,
    makeDirectory,
} from './File'

export const SQLITE_DB_PATH = `${Paths.document.uri}/SQLite/db.db`

const CHARACTERS_PREFIX = 'characters/'
const DB_ENTRY = 'db.db'

const backupFileName = (appVersion: string) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    return `${appVersion}-animaforge-backup-${stamp}.zip`
}

const isZipName = (name: string) => name.toLowerCase().endsWith('.zip')

const readBytes = async (path: string) => new File(path).bytes()

const writeBytes = async (path: string, data: Uint8Array) => {
    const file = new File(path)
    if (file.exists) file.delete()
    file.create({ intermediates: true })
    file.write(data)
}

const clearCharacterImages = () => {
    makeDirectory(AppDirectory.CharacterPath)
    for (const name of listFiles(AppDirectory.CharacterPath)) {
        deleteFile(`${AppDirectory.CharacterPath}${name}`)
    }
}

const collectCharacterImages = async () => {
    const files: Record<string, Uint8Array> = {}
    makeDirectory(AppDirectory.CharacterPath)
    for (const name of listFiles(AppDirectory.CharacterPath)) {
        const path = `${AppDirectory.CharacterPath}${name}`
        if (!fileExists(path)) continue
        files[`${CHARACTERS_PREFIX}${name}`] = await readBytes(path)
    }
    return files
}

/** Export SQLite DB + character/user images as a single zip download. */
export const exportAppBackup = async (appVersion: string) => {
    if (!fileExists(SQLITE_DB_PATH)) {
        throw new Error('Database file not found')
    }

    const files: Record<string, Uint8Array> = {
        [DB_ENTRY]: await readBytes(SQLITE_DB_PATH),
        ...(await collectCharacterImages()),
    }

    const zipped = zipSync(files, { level: 1 })
    const filename = backupFileName(appVersion)
    const cachePath = `${Paths.cache.uri}${filename}`
    await writeBytes(cachePath, zipped)
    await localDownload(cachePath.replace('file://', ''))
}

/** Restore from a backup zip (db + images) or legacy bare db.db file. */
export const importAppBackup = async (uri: string, name: string) => {
    if (isZipName(name)) {
        const archive = await readBytes(uri)
        const unzipped = unzipSync(archive)
        const dbBytes = unzipped[DB_ENTRY]
        if (!dbBytes) {
            throw new Error('Backup zip is missing db.db')
        }

        deleteFile(SQLITE_DB_PATH)
        await writeBytes(SQLITE_DB_PATH, dbBytes)

        clearCharacterImages()
        for (const [entry, data] of Object.entries(unzipped)) {
            if (!entry.startsWith(CHARACTERS_PREFIX) || !data) continue
            const filename = entry.slice(CHARACTERS_PREFIX.length)
            if (!filename || filename.includes('/') || filename.includes('..')) continue
            await writeBytes(`${AppDirectory.CharacterPath}${filename}`, data)
        }
        return
    }

    deleteFile(SQLITE_DB_PATH)
    const copied = await copyFile({ from: uri, to: SQLITE_DB_PATH })
    if (!copied) {
        throw new Error('Failed to copy database file')
    }
}
