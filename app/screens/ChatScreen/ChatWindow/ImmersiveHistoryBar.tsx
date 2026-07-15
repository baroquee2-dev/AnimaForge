import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'

import { Theme } from '@lib/theme/ThemeManager'

type ImmersiveHistoryBarProps = {
    count: number
    expanded: boolean
    onToggle: () => void
    variant?: 'inline' | 'floating'
}

const ImmersiveHistoryBar: React.FC<ImmersiveHistoryBarProps> = ({
    count,
    expanded,
    onToggle,
    variant = 'inline',
}) => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()

    if (count <= 0) return null

    if (variant === 'floating') {
        return (
            <Pressable
                onPress={onToggle}
                hitSlop={8}
                style={{
                    position: 'absolute',
                    top: spacing.sm,
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
                    {expanded ? '收起' : `${count}`}
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
                {expanded ? '▲ Hide earlier messages' : `▼ ${count} earlier message${count > 1 ? 's' : ''}`}
            </Text>
        </Pressable>
    )
}

export default ImmersiveHistoryBar
