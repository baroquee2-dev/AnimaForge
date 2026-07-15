import { getLocales } from 'expo-localization'
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { useCallback, useRef, useState } from 'react'

import { Logger } from '@lib/state/Logger'

const getSpeechLocale = () => {
    const locales = getLocales()
    return locales[0]?.languageTag ?? 'zh-TW'
}

const joinText = (base: string, spoken: string) => {
    if (!spoken) return base
    if (!base) return spoken
    const needsSpace = !base.endsWith(' ') && !base.endsWith('\n')
    return base + (needsSpace ? ' ' : '') + spoken
}

export const useSpeechInput = (onTextUpdate: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false)
    const baseTextRef = useRef('')
    const isListeningRef = useRef(false)

    useSpeechRecognitionEvent('start', () => {
        setIsListening(true)
        isListeningRef.current = true
    })

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false)
        isListeningRef.current = false
    })

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results?.[0]?.transcript ?? ''
        if (!transcript) return
        onTextUpdate(joinText(baseTextRef.current, transcript))
    })

    useSpeechRecognitionEvent('error', (event) => {
        setIsListening(false)
        isListeningRef.current = false
        if (event.error === 'aborted') return
        Logger.warnToast(`Voice input: ${event.message ?? event.error}`)
    })

    const stopListening = useCallback(() => {
        if (!isListeningRef.current) return
        ExpoSpeechRecognitionModule.stop()
    }, [])

    const toggleListening = useCallback(
        async (currentText: string) => {
            if (isListeningRef.current) {
                stopListening()
                return
            }

            if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
                Logger.warnToast('Voice input is not available on this device')
                return
            }

            const permission =
                await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync()
            if (!permission.granted) {
                Logger.warnToast('Microphone permission is required for voice input')
                return
            }

            baseTextRef.current = currentText

            try {
                ExpoSpeechRecognitionModule.start({
                    lang: getSpeechLocale(),
                    interimResults: true,
                    continuous: true,
                })
            } catch {
                Logger.warnToast('Failed to start voice input')
            }
        },
        [stopListening]
    )

    return { isListening, toggleListening, stopListening }
}
