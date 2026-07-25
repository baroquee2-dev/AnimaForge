import { getLocales } from 'expo-localization'
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { useCallback, useRef, useState } from 'react'

import i18n from '@lib/i18n'
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
        Logger.warnToast(
            i18n.t('toast.voiceInputEvent', { message: event.message ?? event.error })
        )
    })

    const turnOffListening = useCallback(() => {
        // Reset mic UI immediately; native `end` events are not always emitted on send.
        isListeningRef.current = false
        setIsListening(false)
        try {
            ExpoSpeechRecognitionModule.stop()
        } catch {
            // Session may already have ended without firing the `end` event.
        }
    }, [])

    const toggleListening = useCallback(
        async (currentText: string) => {
            if (isListeningRef.current) {
                turnOffListening()
                return
            }

            if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
                Logger.warnToast(i18n.t('toast.voiceInputUnavailable'))
                return
            }

            const permission =
                await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync()
            if (!permission.granted) {
                Logger.warnToast(i18n.t('toast.micPermissionRequired'))
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
                Logger.warnToast(i18n.t('toast.voiceInputStartFailed'))
            }
        },
        [turnOffListening]
    )

    return { isListening, toggleListening, turnOffListening }
}
