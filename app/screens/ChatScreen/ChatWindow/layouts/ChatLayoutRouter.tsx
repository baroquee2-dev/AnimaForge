import type { ChatLayout } from '@lib/constants/ChatLayout'

import { useChatLayoutContext } from '../ChatLayoutContext'
import MessengerChatLayout from './MessengerChatLayout'
import VisualNovelChatLayout from './VisualNovelChatLayout'

/** Add the third layout component here when introducing a new ChatLayout value. */
const CHAT_LAYOUT_VIEWS: Record<ChatLayout, React.ComponentType> = {
    visualNovel: VisualNovelChatLayout,
    messenger: MessengerChatLayout,
}

const ChatLayoutRouter = () => {
    const { layout } = useChatLayoutContext()
    const LayoutView = CHAT_LAYOUT_VIEWS[layout] ?? MessengerChatLayout

    return <LayoutView />
}

export default ChatLayoutRouter
