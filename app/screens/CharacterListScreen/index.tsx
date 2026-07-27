import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import Drawer from '@components/views/Drawer'
import { openChatForCharacter } from '@lib/chat/openChatForCharacter'
import { usePendingChatOpen } from '@lib/state/PendingChatOpen'

import CharacterList from './CharacterList'
import SettingsDrawer from '../../components/views/SettingsDrawer'

const CharacterListScreen = () => {
    const router = useRouter()

    // After saving a brand-new character, the editor pops here and queues a chat
    // open. Push from this screen (not from the editor) to avoid native-stack
    // header crashes during the pop.
    useFocusEffect(
        useCallback(() => {
            const { characterId, clear } = usePendingChatOpen.getState()
            if (characterId === undefined) return
            clear()

            let cancelled = false
            void (async () => {
                const opened = await openChatForCharacter(characterId)
                if (cancelled || !opened) return
                router.push('/screens/ChatScreen')
            })()

            return () => {
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
