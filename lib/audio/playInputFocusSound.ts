import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

const sounds = {
    focus: require('@assets/sounds/chat-input-focus.wav'),
    send: require('@assets/sounds/chat-input-send.wav'),
} as const

type SoundKey = keyof typeof sounds

const volumes: Record<SoundKey, number> = {
    focus: 1,
    send: 1,
}

const players: Partial<Record<SoundKey, AudioPlayer>> = {}
let audioModeReady = false

const playChatUiSound = (key: SoundKey) => {
    void (async () => {
        try {
            if (!audioModeReady) {
                await setAudioModeAsync({ playsInSilentMode: true })
                audioModeReady = true
            }
            if (!players[key]) {
                players[key] = createAudioPlayer(sounds[key])
            }
            const player = players[key]
            if (!player) return
            player.volume = volumes[key]
            await player.seekTo(0)
            player.play()
        } catch {
            // Optional UI feedback; ignore playback failures.
        }
    })()
}

export const playInputFocusSound = () => playChatUiSound('focus')
export const playInputSendSound = () => playChatUiSound('send')
