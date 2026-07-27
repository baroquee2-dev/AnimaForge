import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import Drawer from '@components/views/Drawer'
import { openChatForCharacter } from '@lib/chat/openChatForCharacter'
import { Logger } from '@lib/state/Logger'
import { usePendingChatOpen } from '@lib/state/PendingChatOpen'

import CharacterList from './CharacterList'
import SettingsDrawer from '../../components/views/SettingsDrawer'

const CharacterListScreen = () => {
    const router = useRouter()

    // The editor pops back here after saving, then the chat is pushed from this
    // mounted screen. Awaiting the chat load also keeps the push out of the
    // commit that removed the editor, which is what native screens chokes on.
    // The request is read on focus rather than subscribed to, so clearing it
    // does not re-run this effect and cancel the pending navigation.
    useFocusEffect(
        useCallback(() => {
            const { characterId, clear } = usePendingChatOpen.getState()
            // TEMP [SaveFlow] diagnostics — remove once the redbox is understood.
            Logger.info(`[SaveFlow] list focused pending=${characterId}`)
            if (characterId === undefined) return
            clear()

            let cancelled = false
            const openChat = async () => {
                const opened = await openChatForCharacter(characterId)
                Logger.info(`[SaveFlow] list openChat opened=${opened} cancelled=${cancelled}`)
                if (cancelled || !opened) return
                Logger.info('[SaveFlow] list pushing ChatScreen')
                router.push('/screens/ChatScreen')
                Logger.info('[SaveFlow] list push returned')
            }
            void openChat()

            return () => {
                Logger.info('[SaveFlow] list blur/unmount, cancelling pending open')
                cancelled = true
            }
        }, [router])
    )

    return (
        <Drawer.Gesture
            config={[
                { drawerID: Drawer.ID.SETTINGS, openDirection: 'right', closeDirection: 'left' },
            ]}>
            <SafeAreaView
                edges={['bottom']}
                style={{
                    flex: 1,
                    flexDirection: 'row',
                }}>
                <CharacterList />
                <SettingsDrawer />
            </SafeAreaView>
        </Drawer.Gesture>
    )
}

export default CharacterListScreen
