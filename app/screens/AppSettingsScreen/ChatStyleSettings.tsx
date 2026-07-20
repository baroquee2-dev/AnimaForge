import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

import HorizontalSelector from '@components/input/HorizontalSelector'
import HeaderTitle from '@components/views/HeaderTitle'
import { MarkdownStyle } from '@lib/markdown/Markdown'
import { ChatStyle } from '@lib/state/ChatStyle'
import { Theme } from '@lib/theme/ThemeManager'

const previewText = `
「這是一段對話預覽，切換字體時應能看出差異。」

She paused for a moment. **This line is bold.**

A *emphasized* (italic) text example.

"Quoted dialogue looks like this."
`

const ChatStyling = () => {
    const { markdown, rules, style } = MarkdownStyle.useCustomFormatting()
    const { weight, size, dialogueFont, setWeight, setSize, setDialogueFont } = ChatStyle.useChatStyle(
        useShallow((state) => ({
            weight: state.textWeight,
            size: state.fontSize,
            dialogueFont: state.dialogueFont,
            setWeight: state.setTextWeight,
            setSize: state.setFontSize,
            setDialogueFont: state.setDialogueFont,
        }))
    )
    const { color } = Theme.useTheme()
    const previewBoxStyle = {
        borderRadius: 12,
        alignItems: 'center' as const,
        padding: 24,
        justifyContent: 'center' as const,
        borderColor: color.neutral._200,
        borderWidth: 1,
    }
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32, rowGap: 4 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator>
                <HeaderTitle title="Chat Styling" />

                <HorizontalSelector
                    values={ChatStyle.SIZES.map((item) => ({
                        value: item,
                        label: item.toUpperCase(),
                    }))}
                    label={'Font Size'}
                    selected={size}
                    onPress={(item) => setSize(item)}
                    style={{ flex: 0 }}
                />
                <HorizontalSelector
                    values={ChatStyle.WEIGHTS.map((item) => ({
                        value: item,
                        label: item,
                    }))}
                    label={'Font Weight'}
                    selected={weight}
                    onPress={(item) => setWeight(item)}
                    style={{ flex: 0 }}
                />
                <HorizontalSelector
                    values={ChatStyle.DIALOGUE_FONTS.map((item) => ({
                        value: item,
                        label: item === 'system' ? 'System' : 'Noto Sans',
                    }))}
                    label={'Font'}
                    selected={dialogueFont}
                    onPress={(item) => setDialogueFont(item)}
                    style={{ flex: 0 }}
                />

                <Text style={{ color: color.text._300, fontSize: 12, marginTop: 16 }}>
                    Preview
                </Text>
                <View style={previewBoxStyle}>
                    <Markdown mergeStyle={false} markdownit={markdown} rules={rules} style={style}>
                        {previewText}
                    </Markdown>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default ChatStyling
