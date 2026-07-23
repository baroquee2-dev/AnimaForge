import type { ChatLayout } from '@lib/constants/ChatLayout'

import { useChatLayoutContext } from '@lib/chat/ChatLayoutContext'
import ImmersiveChatLayout from './ImmersiveChatLayout'
import MessengerChatLayout from './MessengerChatLayout'
import VisualNovelChatLayout from './VisualNovelChatLayout'

const CHAT_LAYOUT_VIEWS: Record<ChatLayout, React.ComponentType> = {
    visualNovel: VisualNovelChatLayout,
    messenger: MessengerChatLayout,
    immersive: ImmersiveChatLayout,
}

const ChatLayoutRouter = () => {
    const { layout } = useChatLayoutContext()
    const LayoutView = CHAT_LAYOUT_VIEWS[layout] ?? VisualNovelChatLayout

    return <LayoutView />
}

export default ChatLayoutRouter
