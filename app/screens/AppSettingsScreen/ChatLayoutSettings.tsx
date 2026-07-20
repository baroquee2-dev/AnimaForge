import React, { useMemo } from 'react'
import { Text, View } from 'react-native'

import DropdownSheet from '@components/input/DropdownSheet'
import {
    CHAT_LAYOUT_OPTIONS,
    useChatLayout,
} from '@lib/constants/ChatLayout'
import { Theme } from '@lib/theme/ThemeManager'

const ChatLayoutSettings = () => {
    const { color, spacing, fontSize, borderRadius, borderWidth } = Theme.useTheme()
    const { layout, setLayout } = useChatLayout()

    const selectedLayout = useMemo(
        () => CHAT_LAYOUT_OPTIONS.find((item) => item.value === layout) ?? CHAT_LAYOUT_OPTIONS[0],
        [layout]
    )

    return (
        <View
            style={{
                rowGap: spacing.m,
                padding: spacing.l,
                borderRadius: borderRadius.l,
                borderWidth: borderWidth.m,
                borderColor: color.primary._400,
                backgroundColor: color.neutral._200 + 'cc',
            }}>
            <Text
                style={{
                    color: color.text._100,
                    fontSize: fontSize.xl,
                    fontWeight: '700',
                }}>
                Chat Layout
            </Text>
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
    )
}

export default ChatLayoutSettings
