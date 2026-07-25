import { SamplerConfigData, SamplerID } from '@lib/constants/SamplerData'
import { getNestedValue } from '@lib/utils/Parsing'

import { APIConfiguration, APIValues } from './APIBuilder.types'
import { Message } from './ContextBuilder'

type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }

type GeminiContent = {
    role: 'user' | 'model'
    parts: GeminiPart[]
}

const normalizeGeminiModelName = (name: string) => {
    let normalized = name.trim()
    if (normalized.startsWith('models/')) {
        normalized = normalized.slice('models/'.length)
    }
    if (normalized.startsWith('google/')) {
        normalized = normalized.slice('google/'.length)
    }
    return normalized
}

export const resolveGeminiModelName = (
    apiConfig: APIConfiguration,
    apiValues: APIValues
): string | null => {
    const modelValue = apiValues.model
    if (!modelValue) return null

    if (typeof modelValue === 'string') {
        return normalizeGeminiModelName(modelValue)
    }

    const candidates = [
        getNestedValue(modelValue, apiConfig.model.nameParser),
        modelValue.id,
        modelValue.name,
        modelValue.model,
        modelValue.baseModelId,
    ]

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return normalizeGeminiModelName(candidate)
        }
    }

    return null
}

const toGeminiParts = (content: string | { type: string; text?: string; image_url?: { url: string }; input_audio?: { data: string; format: string } }[]): GeminiPart[] => {
    if (typeof content === 'string') return [{ text: content }]

    return content.flatMap((item): GeminiPart[] => {
        if (item.type === 'text' || item.type === 'input_text') {
            return item.text ? [{ text: item.text }] : []
        }
        if (item.type === 'image_url' && item.image_url?.url) {
            const match = item.image_url.url.match(/^data:([^;]+);base64,(.+)$/)
            if (!match) return []
            return [{ inlineData: { mimeType: match[1], data: match[2] } }]
        }
        if (item.type === 'input_audio' && item.input_audio?.data) {
            const format = item.input_audio.format
            const mimeType = format.includes('/') ? format : `audio/${format}`
            return [{ inlineData: { mimeType, data: item.input_audio.data } }]
        }
        return []
    })
}

const mergeContents = (contents: GeminiContent[]): GeminiContent[] => {
    const merged: GeminiContent[] = []
    for (const entry of contents) {
        const last = merged[merged.length - 1]
        if (last && last.role === entry.role) {
            last.parts.push(...entry.parts)
            continue
        }
        merged.push({ role: entry.role, parts: [...entry.parts] })
    }
    return merged
}

export const convertMessagesToGemini = (messages: Message[], contentKey: string) => {
    let systemInstruction: { parts: GeminiPart[] } | undefined
    const contents: GeminiContent[] = []

    for (const message of messages) {
        const role = message.role
        const content = message[contentKey]
        const parts = toGeminiParts(content as any)
        if (!parts.length) continue

        if (role === 'system') {
            systemInstruction = systemInstruction
                ? { parts: [...systemInstruction.parts, ...parts] }
                : { parts }
            continue
        }

        contents.push({
            role: role === 'assistant' ? 'model' : 'user',
            parts,
        })
    }

    return {
        systemInstruction,
        contents: mergeContents(contents),
    }
}

export const buildGeminiGroundingPayload = (
    messages: Message[],
    contentKey: string,
    samplers: SamplerConfigData,
    stopSequence: string[]
) => {
    const { systemInstruction, contents } = convertMessagesToGemini(messages, contentKey)

    const generationConfig: Record<string, number | string | string[]> = {
        maxOutputTokens: samplers[SamplerID.GENERATED_LENGTH],
        temperature: samplers[SamplerID.TEMPERATURE],
        topP: samplers[SamplerID.TOP_P],
    }

    if (stopSequence.length) {
        generationConfig.stopSequences = stopSequence
    }

    return {
        ...(systemInstruction ? { systemInstruction } : {}),
        contents,
        tools: [{ google_search: {} }],
        generationConfig,
    }
}

export const getGeminiGroundingEndpoint = (apiConfig: APIConfiguration, apiValues: APIValues) => {
    const model = resolveGeminiModelName(apiConfig, apiValues)
    if (!model) return null
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
}

export const parseGeminiGroundingText = (event: any): string => {
    const data = typeof event === 'string' ? JSON.parse(event) : event
    const parts = data?.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) return ''

    return parts
        .map((part: { text?: string }) => part?.text ?? '')
        .join('')
}
