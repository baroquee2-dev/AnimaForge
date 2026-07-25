import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage } from '@lib/storage/MMKV'

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

const resolveDeviceLanguage = (): AppLanguageId => {
    const locale = getLocales()[0]
    const tag = locale?.languageTag ?? 'en'
    const code = locale?.languageCode ?? 'en'

    if (tag.startsWith('zh-TW') || tag.includes('Hant') || code === 'zh') {
        return 'zh-TW'
    }
    return 'en'
}

const deviceLanguage = resolveDeviceLanguage()

type LanguageStoreProps = {
    language: AppLanguageId
    setLanguage: (language: AppLanguageId) => void
}

export const useLanguageStore = create<LanguageStoreProps>()(
    persist(
        (set) => ({
            language: deviceLanguage,
            setLanguage: (language) => {
                set({ language })
                void i18n.changeLanguage(language)
            },
        }),
        {
            name: Storage.Language,
            storage: createMMKVStorage(),
            partialize: (state) => ({ language: state.language }),
            version: 1,
            onRehydrateStorage: () => (state) => {
                if (state?.language) {
                    void i18n.changeLanguage(state.language)
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
    lng: useLanguageStore.getState().language ?? deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    compatibilityJSON: 'v4',
})

export default i18n
