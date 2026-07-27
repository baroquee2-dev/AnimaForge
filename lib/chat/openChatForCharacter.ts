import i18n from '@lib/i18n'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'

/** Loads a character and its latest chat (creates one if missing). */
export const openChatForCharacter = async (
    characterId: number,
    knownChatId?: number
): Promise<boolean> => {
    try {
        await Characters.useCharacterStore.getState().setCard(characterId)

        let chatId = knownChatId
        if (!chatId) {
            const chatsForCharacter = await Chats.db.query.chatList(characterId)
            chatId = [...chatsForCharacter].sort(
                (a, b) => (b.last_modified ?? 0) - (a.last_modified ?? 0)
            )[0]?.id
        }
        if (!chatId) chatId = await Chats.db.mutate.createChat(characterId)
        if (!chatId) {
            Logger.errorToast(i18n.t('characterList.chatCreateFailed'))
            return false
        }

        await Chats.useChatState.getState().load(chatId)
        return true
    } catch (e) {
        Logger.errorToast(i18n.t('characterList.loadFailed', { error: e }))
        Logger.error(`Failed to open chat for character ${characterId}: ${e}`)
        return false
    }
}
