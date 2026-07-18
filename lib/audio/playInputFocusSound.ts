import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio'

const sounds = {
    focus: require('@assets/sounds/chat-input-focus.wav'),
    send: require('@assets/sounds/chat-input-send.wav'),
    characterList: require('@assets/sounds/ui-character-list.wav'),
    chatEnter: require('@assets/sounds/ui-chat-enter.wav'),
} as const

type SoundKey = keyof typeof sounds

const volumes: Record<SoundKey, number> = {
    focus: 1,
    send: 1,
    characterList: 0.9,
    chatEnter: 0.9,
}

const players: Partial<Record<SoundKey, AudioPlayer>> = {}

const bindAutoPause = (player: AudioPlayer) => {
    player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.didJustFinish) {
            player.pause()
        }
    })
}

const ensureUiSoundMode = async () => {
    await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
    })
}

const playChatUiSound = (key: SoundKey) => {
    void (async () => {
        try {
            await ensureUiSoundMode()
            if (!players[key]) {
                players[key] = createAudioPlayer(sounds[key], {
                    keepAudioSessionActive: false,
                })
                bindAutoPause(players[key])
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
export const playCharacterListSound = () => playChatUiSound('characterList')
export const playChatEnterSound = () => playChatUiSound('chatEnter')
