import React, { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

import DropdownSheet from '@components/input/DropdownSheet'
import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import {
    CHAT_LAYOUT_OPTIONS,
    useChatLayout,
} from '@lib/constants/ChatLayout'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Theme } from '@lib/theme/ThemeManager'

const ChatWindowSettings = () => {
    const { color, spacing, fontSize } = Theme.useTheme()
    const [autoScroll, setAutoScroll] = useMMKVBoolean(AppSettings.AutoScroll)
    const [sendOnEnter, setSendOnEnter] = useMMKVBoolean(AppSettings.SendOnEnter)
    const [quickDelete, setQuickDelete] = useMMKVBoolean(AppSettings.QuickDelete)
    const [saveScroll, setSaveScroll] = useMMKVBoolean(AppSettings.SaveScrollPosition)
    const [alternate, setAlternate] = useMMKVBoolean(AppSettings.AlternatingChatMode)
    const [wide, setWide] = useMMKVBoolean(AppSettings.WideChatMode)
    const { layout, setLayout, capabilities } = useChatLayout()

    const [showTokensPerSecond, setShowTokensPerSecond] = useMMKVBoolean(
        AppSettings.ShowTokenPerSecond
    )

    const selectedLayout = useMemo(
        () => CHAT_LAYOUT_OPTIONS.find((item) => item.value === layout) ?? CHAT_LAYOUT_OPTIONS[0],
        [layout]
    )

    return (
        <View style={{ rowGap: 8 }}>
            <SectionTitle>Chat Window</SectionTitle>

            <ThemedSwitch
                label="Auto Scroll"
                value={autoScroll}
                onChangeValue={setAutoScroll}
                description="Autoscrolls text during generations"
            />

            <ThemedSwitch
                label="Send on Enter"
                value={sendOnEnter}
                onChangeValue={setSendOnEnter}
                description="Submits messages when Enter is pressed"
            />

            <ThemedSwitch
                label="Show Tokens Per Second"
                value={showTokensPerSecond}
                onChangeValue={setShowTokensPerSecond}
                description="Show tokens per second when using local models"
            />

            <ThemedSwitch
                label="Quick Delete"
                value={quickDelete}
                onChangeValue={setQuickDelete}
                description="Toggle delete button in chat options bar"
            />

            {capabilities.supportsScrollPersistence && (
                <ThemedSwitch
                    label="Save Scroll Position"
                    value={saveScroll}
                    onChangeValue={setSaveScroll}
                    description="Automatically move to last scrolled position in chat"
                />
            )}

            <View style={{ rowGap: spacing.s }}>
                <Text style={{ color: color.text._100, fontSize: fontSize.l }}>Layout</Text>
                <Text style={{ color: color.text._400, fontSize: fontSize.s }}>
                    {selectedLayout.description}
                </Text>
                <DropdownSheet
                    selected={selectedLayout}
                    data={CHAT_LAYOUT_OPTIONS}
                    labelExtractor={(item) => item.label}
                    onChangeValue={(item) => setLayout(item.value)}
                    modalTitle="Chat Layout"
                />
            </View>

            {capabilities.supportsWideChat && (
                <ThemedSwitch
                    label="Wide Chat"
                    value={wide}
                    onChangeValue={setWide}
                    description="Removes whitespace for wider chat"
                />
            )}

            {capabilities.supportsAlternateAlignment && (
                <ThemedSwitch
                    label="Alternate User and Character Positions"
                    value={alternate}
                    onChangeValue={setAlternate}
                    description="Left align character chats and right aligns user chats"
                />
            )}
        </View>
    )
}

export default ChatWindowSettings
