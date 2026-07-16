import { useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'

import Avatar from '@components/views/Avatar'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { useAvatarViewerStore } from '@lib/state/components/AvatarViewer'
import { Theme } from '@lib/theme/ThemeManager'

import { portraitEntrance } from './chatAnimations'
import { getImmersivePortraitSize } from './ChatFrame'
import PortraitBreathing from './PortraitBreathing'

type ImmersivePortraitHeaderProps = {
    index: number
    nowGenerating: boolean
}

const ImmersivePortraitHeader: React.FC<ImmersivePortraitHeaderProps> = ({ index, nowGenerating }) => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()
    const message = Chats.useEntryData(index)
    const setShowViewer = useAvatarViewerStore((state) => state.setShow)
    const charImageId = Characters.useCharacterStore((state) => state.card?.image_id) ?? 0
    const immersivePortraitSize = useMemo(getImmersivePortraitSize, [])

    return (
        <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <Animated.View key={charImageId} entering={portraitEntrance}>
                <PortraitBreathing active={nowGenerating}>
                    <TouchableOpacity onPress={() => setShowViewer(true, false)}>
                        <Avatar
                            contentFit="cover"
                            style={{
                                width: immersivePortraitSize.width,
                                height: immersivePortraitSize.height,
                                borderRadius: borderRadius.xl2,
                                borderWidth: 2,
                                borderColor: color.neutral._100 + '88',
                            }}
                            targetImage={Characters.getImageDir(charImageId)}
                        />
                    </TouchableOpacity>
                </PortraitBreathing>
            </Animated.View>
            <Text
                style={{
                    fontSize: fontSize.xl2,
                    color: color.text._100,
                    fontWeight: '600',
                    marginTop: spacing.sm,
                    marginBottom: spacing.sm,
                }}>
                {message.name}
            </Text>
        </View>
    )
}

export default ImmersivePortraitHeader
