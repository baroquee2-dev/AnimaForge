import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage, mmkv } from '@lib/storage/MMKV'

import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'

export type AppLanguageId = 'en' | 'zh-TW'

export type SupportedLanguage = {
    id: AppLanguageId
    labelKey: string
    translation: object
}

export const supportedLanguages: SupportedLanguage[] = [
    {
        id: 'en',
        labelKey: 'settings.language.en',
        translation: en,
    },
    {
        id: 'zh-TW',
        labelKey: 'settings.language.zhTW',
        translation: zhTW,
    },
]

const isAppLanguageId = (value: unknown): value is AppLanguageId =>
    value === 'en' || value === 'zh-TW'

const resolveDeviceLanguage = (): AppLanguageId => {
    const locale = getLocales()[0]
    const tag = locale?.languageTag ?? 'en'
    const code = locale?.languageCode ?? 'en'

    if (tag.startsWith('zh-TW') || tag.includes('Hant') || code === 'zh') {
        return 'zh-TW'
    }
    return 'en'
}

/** Read persisted language synchronously so i18n can init before async zustand rehydrate. */
const readPersistedLanguage = (): AppLanguageId | null => {
    try {
        const raw = mmkv.getString(Storage.Language)
        if (!raw) return null
        const parsed = JSON.parse(raw) as { state?: { language?: unknown } }
        return isAppLanguageId(parsed?.state?.language) ? parsed.state.language : null
    } catch {
        return null
    }
}

const deviceLanguage = resolveDeviceLanguage()
const initialLanguage = readPersistedLanguage() ?? deviceLanguage

type LanguageStoreProps = {
    language: AppLanguageId
    setLanguage: (language: AppLanguageId) => void
}

const applyLanguage = (language: AppLanguageId) => {
    if (i18n.isInitialized) {
        void i18n.changeLanguage(language)
        return
    }
    // Ensure late rehydrate still wins if it races ahead of init.
    i18n.once('initialized', () => {
        void i18n.changeLanguage(language)
    })
}

export const useLanguageStore = create<LanguageStoreProps>()(
    persist(
        (set) => ({
            language: initialLanguage,
            setLanguage: (language) => {
                set({ language })
                applyLanguage(language)
            },
        }),
        {
            name: Storage.Language,
            storage: createMMKVStorage(),
            partialize: (state) => ({ language: state.language }),
            version: 1,
            onRehydrateStorage: () => (state) => {
                if (state?.language && isAppLanguageId(state.language)) {
                    applyLanguage(state.language)
                }
            },
        }
    )
)

const resources = Object.fromEntries(
    supportedLanguages.map(({ id, translation }) => [id, { translation }])
)

void i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    compatibilityJSON: 'v4',
})

/** Translate sampler field labels by SamplerID, falling back to English friendlyName. */
export const tSamplerField = (samplerId: string, fallback: string) =>
    i18n.t(`sampler.fields.${samplerId}`, { defaultValue: fallback })

export default i18n
