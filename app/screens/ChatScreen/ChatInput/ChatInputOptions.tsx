import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import ContextMenu from '@components/views/ContextMenu'
import Drawer from '@components/views/Drawer'
import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

const ChatOptions = () => {
    const router = useRouter()
    const styles = useStyles()
    const { t } = useTranslation()
    const { autoSummary, setAutoSummary } = Chats.useChatState(
        useShallow((state) => ({
            autoSummary: state.data?.auto_summary ?? false,
            setAutoSummary: state.setAutoSummary,
        }))
    )

    const setShow = Drawer.useDrawerStore((state) => state.setShow)

    const setShowChat = (b: boolean) => {
        setShow(Drawer.ID.CHATLIST, b)
    }

    return (
        <ContextMenu
            buttons={[
                {
                    onPress: (close) => {
                        close()
                        router.back()
                    },
                    label: t('chat.mainMenu'),
                    icon: 'backward',
                },
                {
                    onPress: (close) => {
                        close()
                        router.push('/screens/CharacterEditorScreen')
                    },
                    label: t('chat.editCharacter'),
                    icon: 'edit',
                },
                {
                    onPress: (close) => {
                        setShowChat(true)
                        close()
                    },
                    label: t('chat.chatHistory'),
                    icon: 'paper-clip',
                },
                {
                    onPress: (close) => {
                        setAutoSummary(!autoSummary)
                        close()
                    },
                    label: t('chat.autoSummary'),
                    icon: 'book',
                    status: autoSummary,
                },
            ]}
            placement="top">
            <Ionicons name="caret-up" style={styles.optionsButton} size={24} />
        </ContextMenu>
    )
}

export default ChatOptions

const useStyles = () => {
    const { color } = Theme.useTheme()

    return StyleSheet.create({
        optionsButton: {
            color: color.text._500,
            padding: 4,
            backgroundColor: color.neutral._200,
            borderRadius: 16,
        },
    })
}
