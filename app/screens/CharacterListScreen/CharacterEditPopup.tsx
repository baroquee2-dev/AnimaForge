import { usePathname, useRouter } from 'expo-router'
import { ReactNode } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import Alert from '@components/views/Alert'
import ContextMenu from '@components/views/ContextMenu'
import i18n from '@lib/i18n'
import { CharInfo, Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'

type CharacterEditPopupProps = {
    character: CharInfo
    nowLoading: boolean
    setNowLoading: (b: boolean) => void
    children: ReactNode
}

const CharacterEditPopup: React.FC<CharacterEditPopupProps> = ({
    character,
    setNowLoading,
    nowLoading,
    children,
}) => {
    const { t } = useTranslation()
    const path = usePathname()
    const router = useRouter()

    const { loadChat } = Chats.useChat()

    const setCurrentCharacter = async () => {
        if (nowLoading || path === '/screens/ChatScreen' || !character.id) return
        try {
            setNowLoading(true)
            await setCurrentCard(character.id)
            let chatId = character.latestChat
            if (!chatId) {
                chatId = await Chats.db.mutate.createChat(character.id)
            }
            if (!chatId) {
                Logger.errorToast(i18n.t('characterList.chatCreateFailed'))
                return
            }
            await loadChat(chatId)
            setNowLoading(false)
            router.push('/screens/ChatScreen')
        } catch (error) {
            Logger.errorToast(i18n.t('characterList.loadFailed', { error }))
            setNowLoading(false)
        }
    }

    const setCurrentCard = Characters.useCharacterStore((state) => state.setCard)

    const deleteCard = (close: () => void) => {
        close()
        Alert.alert({
            title: t('characterList.deleteTitle'),
            description: t('characterList.deleteDesc', { name: character.name }),
            buttons: [
                {
                    label: t('common.cancel'),
                },
                {
                    label: t('characterList.deleteConfirm'),
                    onPress: async () => {
                        Characters.db.mutate.deleteCard(character.id ?? -1)
                    },
                    type: 'warning',
                },
            ],
        })
    }

    const cloneCard = (close: () => void) => {
        close()
        Alert.alert({
            title: t('characterList.cloneTitle'),
            description: t('characterList.cloneDesc', { name: character.name }),
            buttons: [
                {
                    label: t('common.cancel'),
                },
                {
                    label: t('characterList.cloneConfirm'),
                    onPress: async () => {
                        setNowLoading(true)
                        await Characters.db.mutate.duplicateCard(character.id)

                        setNowLoading(false)
                    },
                },
            ],
        })
    }

    const editCharacter = async (close: () => void) => {
        if (nowLoading) return
        setNowLoading(true)
        await setCurrentCard(character.id)
        setNowLoading(false)
        close()
        router.push('/screens/CharacterEditorScreen')
    }

    return (
        <ContextMenu
            disabled={nowLoading || path !== '/'}
            onPress={setCurrentCharacter}
            longPress
            delayLongPress={300}
            buttons={[
                { label: t('common.edit'), icon: 'edit', onPress: editCharacter },
                { label: t('common.clone'), icon: 'copy', onPress: cloneCard },
                {
                    label: t('common.delete'),
                    icon: 'delete',
                    onPress: deleteCard,
                    variant: 'warning',
                },
            ]}
            placement="center">
            <View pointerEvents="none">{children}</View>
        </ContextMenu>
    )
}

export default CharacterEditPopup
