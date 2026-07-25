import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { IMMERSIVE_HEADER_BODY_HEIGHT } from '@lib/chat/immersiveLayout'
import { Theme } from '@lib/theme/ThemeManager'

type ImmersiveHistoryBarProps = {
    count: number
    expanded: boolean
    onToggle: () => void
    variant?: 'inline' | 'floating'
    /** Offset below transparent stack header (Immersive edge-to-edge). */
    clearHeaderOverlay?: boolean
}

const ImmersiveHistoryBar: React.FC<ImmersiveHistoryBarProps> = ({
    count,
    expanded,
    onToggle,
    variant = 'inline',
    clearHeaderOverlay = false,
}) => {
    const { t } = useTranslation()
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()
    const insets = useSafeAreaInsets()

    if (count <= 0) return null

    const floatingTop =
        spacing.sm + (clearHeaderOverlay ? insets.top + IMMERSIVE_HEADER_BODY_HEIGHT : 0)

    if (variant === 'floating') {
        return (
            <Pressable
                onPress={onToggle}
                hitSlop={8}
                style={{
                    position: 'absolute',
                    top: floatingTop,
                    right: spacing.m,
                    zIndex: 100,
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: spacing.xs,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    borderRadius: borderRadius.xl,
                    backgroundColor: color.neutral._100 + 'dd',
                    borderWidth: 1,
                    borderColor: color.neutral._300 + 'aa',
                    boxShadow: [
                        {
                            offsetX: 0,
                            offsetY: 2,
                            color: color.shadow,
                            spreadDistance: 0,
                            blurRadius: 6,
                        },
                    ],
                }}>
                <MaterialIcons
                    name={expanded ? 'unfold-less' : 'history'}
                    size={18}
                    color={color.text._300}
                />
                <Text style={{ color: color.text._300, fontSize: fontSize.s, fontWeight: '600' }}>
                    {expanded ? t('chat.collapse') : `${count}`}
                </Text>
            </Pressable>
        )
    }

    return (
        <Pressable
            onPress={onToggle}
            style={{
                alignSelf: 'center',
                marginVertical: spacing.m,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.l,
                borderRadius: borderRadius.xl,
                backgroundColor: color.neutral._100 + 'cc',
                borderWidth: 1,
                borderColor: color.neutral._300,
            }}>
            <Text style={{ color: color.text._300, fontSize: fontSize.s, fontWeight: '500' }}>
                {expanded
                    ? t('chat.hideEarlier')
                    : count === 1
                      ? t('chat.earlierMessage', { count })
                      : t('chat.earlierMessages', { count })}
            </Text>
        </Pressable>
    )
}

export default ImmersiveHistoryBar
