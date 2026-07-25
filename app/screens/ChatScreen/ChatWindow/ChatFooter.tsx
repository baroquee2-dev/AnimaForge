import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Chats } from '@lib/state/Chat'
import { Theme } from '@lib/theme/ThemeManager'

const ChatFooter = () => {
    const { t } = useTranslation()
    const { chatLength } = Chats.useChat()
    const { color, fontSize, spacing, borderRadius } = Theme.useTheme()
    const message =
        chatLength !== undefined && chatLength <= 1
            ? t('chat.sendToBegin')
            : t('chat.startOfChat')

    return (
        <View style={styles.wrapper}>
            <View
                style={{
                    backgroundColor: color.neutral._100 + 'ee',
                    borderRadius: borderRadius.xl,
                    borderWidth: 1,
                    borderColor: color.neutral._300,
                    paddingHorizontal: spacing.l,
                    paddingVertical: spacing.sm,
                    marginBottom: spacing.m,
                    boxShadow: [
                        {
                            offsetX: 0,
                            offsetY: 2,
                            color: color.shadow,
                            spreadDistance: 0,
                            blurRadius: 8,
                        },
                    ],
                }}>
                <Text
                    style={{
                        color: color.text._100,
                        textAlign: 'center',
                        fontSize: fontSize.m,
                        fontWeight: '600',
                        letterSpacing: 0.2,
                    }}>
                    {message}
                </Text>
            </View>
        </View>
    )
}

export default ChatFooter

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        alignSelf: 'center',
        flexShrink: 0,
        paddingBottom: 8,
    },
})
