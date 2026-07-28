import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMMKVBoolean } from 'react-native-mmkv'
import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import Drawer from '@components/views/Drawer'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'
import { getChatLayoutCapabilities, useChatLayout } from '@lib/constants/ChatLayout'
import { useFocusedValue } from '@lib/hooks/useFocusedValue'
import { useAppMode } from '@lib/state/AppMode'
import { useBackgroundStore, resolveChatBackgroundUri } from '@lib/state/BackgroundImage'
import { Characters } from '@lib/state/Characters'
import { ChatLayoutProvider } from '@lib/chat/ChatLayoutContext'

import AnimatedChatBackground from './AnimatedChatBackground'
import ChatHeaderGradient from './ChatHeaderGradient'
import ChatModelName from './ChatModelName'
import ChatLayoutRouter from './layouts/ChatLayoutRouter'

const ChatWindow = () => {
    const charId = Characters.useCharacterStore((state) => state.card?.id)
    const { appMode } = useAppMode()
    const [showModelname] = useMMKVBoolean(AppSettings.ShowModelInChat)
    const { layout } = useChatLayout()
    const capabilities = getChatLayoutCapabilities(layout)
    const { data: { background_image: backgroundImage } = {} } = useLiveQuery(
        Characters.db.query.backgroundImageQuery(charId ?? -1)
    )
    // Freeze while Character Editor is on top so portrait+background edits
    // do not remount buried expo-image views at the same time.
    const stableBackgroundImage = useFocusedValue(backgroundImage, 'chat.background', {
        resumeDelayMs: 0,
    })
    const { showSettings, showChat } = Drawer.useDrawerStore(
        useShallow((state) => ({
            showSettings: state.values?.[Drawer.ID.SETTINGS],
            showChat: state.values?.[Drawer.ID.CHATLIST],
        }))
    )

    const image = useBackgroundStore((state) => state.image)
    const backgroundSource = {
        uri: resolveChatBackgroundUri(stableBackgroundImage, image),
    }

    const chatContent = (
        <ChatLayoutProvider layout={layout}>
            {showModelname && appMode === 'local' && (
                <HeaderTitle headerTitle={() => !showSettings && !showChat && <ChatModelName />} />
            )}

            <ChatLayoutRouter />

            {capabilities.showChatBackground && <ChatHeaderGradient />}
        </ChatLayoutProvider>
    )

    if (!capabilities.showChatBackground) {
        return (
            <View style={{ flex: 1, overflow: 'hidden' }}>
                <View style={{ flex: 1 }}>{chatContent}</View>
            </View>
        )
    }

    return <AnimatedChatBackground uri={backgroundSource.uri}>{chatContent}</AnimatedChatBackground>
}

export default ChatWindow
