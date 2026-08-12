import { useEffect } from 'react'
import { AppState } from 'react-native'
import { create } from 'zustand'

import { Storage } from '@lib/enums/Storage'
import { mmkv } from '@lib/storage/MMKV'

import { Logger } from './Logger'

const MODEL_DATA_URL =
    'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT = 30 * 1000
const LAST_ATTEMPT_KEY = `${Storage.LiteLLMModels}-last-attempt`

export type LiteLLMModelMetadata = {
    aliases?: string[]
    litellm_provider?: string
    max_input_tokens?: number
    max_output_tokens?: number
    max_tokens?: number
    mode?: string
}

type LiteLLMModelMap = Record<string, LiteLLMModelMetadata>

type LiteLLMModelState = {
    models: LiteLLMModelMap
    setModels: (models: LiteLLMModelMap) => void
}

const providerAliases: Record<string, string> = {
    Claude: 'anthropic',
    Cohere: 'cohere',
    'Google AI Studio': 'gemini',
    Ollama: 'ollama',
    OpenAI: 'openai',
    'Open Router': 'openrouter',
    XAI: 'xai',
}

let hydrated = false
let refreshPromise: Promise<void> | undefined

export namespace LiteLLMModels {
    export const useStore = create<LiteLLMModelState>((set) => ({
        models: {},
        setModels: (models) => set({ models }),
    }))

    const hydrate = () => {
        if (hydrated) return
        hydrated = true

        const cachedModels = mmkv.getString(Storage.LiteLLMModels)
        if (!cachedModels) return

        try {
            const models = JSON.parse(cachedModels)
            if (!isModelMap(models)) throw new Error('Cached model metadata is invalid')
            useStore.getState().setModels(models)
        } catch (error) {
            Logger.error(`Could not load cached LiteLLM model metadata: ${getErrorMessage(error)}`)
        }
    }

    export const refreshIfNeeded = async () => {
        hydrate()
        if (refreshPromise) return refreshPromise

        const lastAttempt = mmkv.getNumber(LAST_ATTEMPT_KEY) ?? 0
        if (Date.now() - lastAttempt < UPDATE_INTERVAL) return

        refreshPromise = refresh().finally(() => {
            refreshPromise = undefined
        })
        return refreshPromise
    }

    const refresh = async () => {
        mmkv.set(LAST_ATTEMPT_KEY, Date.now())
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

        try {
            const response = await fetch(MODEL_DATA_URL, { signal: controller.signal })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const models = await response.json()
            if (!isModelMap(models)) throw new Error('Downloaded model metadata is invalid')

            useStore.getState().setModels(models)
            mmkv.set(Storage.LiteLLMModels, JSON.stringify(models))
        } catch (error) {
            Logger.error(`Could not update LiteLLM model metadata: ${getErrorMessage(error)}`)
        } finally {
            clearTimeout(timeout)
        }
    }

    export const useDailyRefresh = () => {
        useEffect(() => {
            let active = true
            let generation = 0
            let timer: ReturnType<typeof setTimeout> | undefined

            const run = async () => {
                const currentGeneration = ++generation
                if (timer) clearTimeout(timer)
                await refreshIfNeeded()
                if (!active || currentGeneration !== generation) return

                const lastAttempt = mmkv.getNumber(LAST_ATTEMPT_KEY) ?? Date.now()
                const delay = Math.max(UPDATE_INTERVAL - (Date.now() - lastAttempt), 1000)
                timer = setTimeout(run, delay)
            }

            if (AppState.currentState === 'active') void run()
            const listener = AppState.addEventListener('change', (nextState) => {
                generation += 1
                if (timer) clearTimeout(timer)
                if (nextState === 'active') void run()
            })

            return () => {
                active = false
                generation += 1
                if (timer) clearTimeout(timer)
                listener.remove()
            }
        }, [])
    }

    export const useMaxContextWindow = (providerName: string, modelName?: string) => {
        return useStore((state) => findMaxContextWindow(state.models, providerName, modelName))
    }
}

const isModelMap = (value: unknown): value is LiteLLMModelMap => {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const findMaxContextWindow = (
    models: LiteLLMModelMap,
    providerName: string,
    modelName?: string
): number | undefined => {
    if (!modelName) return

    const provider = providerAliases[providerName] ?? providerName.toLowerCase().replaceAll(' ', '')
    const normalizedModelName = modelName.replace(/^models\//, '')
    const candidates = [
        `${provider}/${normalizedModelName}`,
        `${provider}/${modelName}`,
        normalizedModelName,
        modelName,
    ]

    for (const key of candidates) {
        const limit = getContextWindow(models[key])
        if (limit) return limit
    }

    for (const metadata of Object.values(models)) {
        if (metadata.litellm_provider && metadata.litellm_provider !== provider) continue
        if (
            !metadata.aliases?.includes(modelName) &&
            !metadata.aliases?.includes(normalizedModelName)
        ) {
            continue
        }
        const limit = getContextWindow(metadata)
        if (limit) return limit
    }
}

const getContextWindow = (metadata?: LiteLLMModelMetadata): number | undefined => {
    const limit = metadata?.max_input_tokens ?? metadata?.max_tokens
    return typeof limit === 'number' && Number.isFinite(limit) && limit > 0 ? limit : undefined
}

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : String(error)
}
