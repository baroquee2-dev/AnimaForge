import { ReactNode, useMemo } from 'react'
import { Dimensions, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated from 'react-native-reanimated'

import Avatar from '@components/views/Avatar'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { useAvatarViewerStore } from '@lib/state/components/AvatarViewer'
import { Theme } from '@lib/theme/ThemeManager'

import PortraitBreathing from './PortraitBreathing'
import { portraitEntrance } from '@lib/animations/chatAnimations'

type ChatFrameProps = {
    children?: ReactNode
    index: number
    nowGenerating: boolean
    isLast?: boolean
    immersive?: boolean
    historyCompact?: boolean
    immersivePortraitExternal?: boolean
}

const COMPACT_AVATAR_SIZE = 28
const IMMERSIVE_PORTRAIT_MAX_HEIGHT_RATIO = 0.52
const IMMERSIVE_PORTRAIT_WIDTH_PADDING = 32
const IMMERSIVE_DIALOGUE_CHROME_HEIGHT = 156

export const getImmersivePortraitSize = () => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
    const portraitWidth = screenWidth - IMMERSIVE_PORTRAIT_WIDTH_PADDING
    const portraitHeight = Math.min(
        screenHeight * IMMERSIVE_PORTRAIT_MAX_HEIGHT_RATIO,
        portraitWidth * 1.2
    )
    return { width: portraitWidth, height: portraitHeight }
}

export const getImmersiveDialogueMaxHeight = (inputHeight: number = 64) => {
    const { height: screenHeight } = Dimensions.get('window')
    const portraitHeight = getImmersivePortraitSize().height
    const remaining =
        screenHeight - portraitHeight - inputHeight - IMMERSIVE_DIALOGUE_CHROME_HEIGHT
    const cap = Math.floor(screenHeight * 0.18)
    return Math.max(72, Math.min(cap, remaining))
}

const ChatFrame: React.FC<ChatFrameProps> = ({
    children,
    index,
    nowGenerating,
    isLast,
    immersive = false,
    historyCompact = false,
    immersivePortraitExternal = false,
}) => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()
    const [wide] = useMMKVBoolean(AppSettings.WideChatMode)
    const [alternate] = useMMKVBoolean(AppSettings.AlternatingChatMode)
    const message = Chats.useEntryData(index)
    const setShowViewer = useAvatarViewerStore((state) => state.setShow)
    const charImageId = Characters.useCharacterStore((state) => state.card?.image_id) ?? 0
    const userImageId = Characters.useUserStore((state) => state.card?.image_id) ?? 0

    const swipe = message.swipes[message.swipe_id]
    const imageId = message.is_user ? userImageId : charImageId
    const showMetadata = !immersive || historyCompact

    const getDeltaTime = () =>
        Math.round(
            Math.max(
                0,
                ((nowGenerating && isLast ? Date.now() : swipe.gen_finished.getTime()) -
                    swipe.gen_started.getTime()) /
                    1000
            )
        )
    const deltaTime = getDeltaTime()

    const rowDir = message.is_user && alternate && !immersive ? 'row-reverse' : 'row'
    const align = message.is_user && alternate && !immersive ? 'flex-end' : 'flex-start'
    const immersivePortraitSize = useMemo(getImmersivePortraitSize, [])

    if (immersive && isLast && !message.is_user) {
        if (immersivePortraitExternal) {
            return <View style={{ width: '100%' }}>{children}</View>
        }

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
                <View style={{ width: '100%' }}>{children}</View>
            </View>
        )
    }

    if (immersive && isLast && message.is_user) {
        return (
            <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.sm }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        columnGap: spacing.sm,
                        marginBottom: spacing.sm,
                    }}>
                    <Text style={{ fontSize: fontSize.m, color: color.text._300, fontWeight: '500' }}>
                        {message.name}
                    </Text>
                    <TouchableOpacity onPress={() => setShowViewer(true, true)}>
                        <Avatar
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: borderRadius.xl,
                            }}
                            targetImage={Characters.getImageDir(userImageId)}
                        />
                    </TouchableOpacity>
                </View>
                <View style={{ width: '100%', maxWidth: '92%' }}>{children}</View>
            </View>
        )
    }

    if (historyCompact) {
        return (
            <View style={{ flexDirection: 'row', columnGap: spacing.sm, alignItems: 'flex-start' }}>
                <TouchableOpacity onPress={() => setShowViewer(true, message.is_user)}>
                    <Avatar
                        style={{
                            width: COMPACT_AVATAR_SIZE,
                            height: COMPACT_AVATAR_SIZE,
                            borderRadius: borderRadius.m,
                        }}
                        targetImage={Characters.getImageDir(imageId)}
                    />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: fontSize.s,
                            color: color.text._400,
                            marginBottom: spacing.xs,
                            fontWeight: '500',
                        }}>
                        {message.name}
                    </Text>
                    {children}
                </View>
            </View>
        )
    }

    if (wide && !immersive)
        return (
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: color.neutral._100 + 'bb',
                }}>
                <View
                    style={{
                        flexDirection: rowDir,
                        alignItems: 'center',
                        marginBottom: spacing.l,
                    }}>
                    <TouchableOpacity onPress={() => setShowViewer(true, message.is_user)}>
                        <Avatar
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: borderRadius.xl,
                                marginRight: message.is_user && alternate ? 0 : spacing.l,
                                marginLeft: message.is_user && alternate ? spacing.l : 0,
                            }}
                            targetImage={Characters.getImageDir(imageId)}
                        />
                    </TouchableOpacity>
                    <View style={{ alignItems: align }}>
                        <Text
                            style={{
                                fontSize: fontSize.l,
                                color: color.text._100,
                            }}>
                            {message.name}
                        </Text>
                        {showMetadata && (
                            <View style={{ columnGap: 12, flexDirection: rowDir }}>
                                <Text style={{ fontSize: fontSize.s, color: color.text._400 }}>
                                    {swipe.gen_finished.toLocaleTimeString()}
                                </Text>
                                <Text style={{ color: color.text._700, fontSize: fontSize.s }}>
                                    #{index}
                                </Text>
                                {deltaTime !== undefined && !message.is_user && index !== 0 && (
                                    <Text style={{ color: color.text._700, fontSize: fontSize.s }}>
                                        {deltaTime}s
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
                {children}
            </View>
        )

    return (
        <View style={{ flexDirection: rowDir }}>
            <View
                style={{
                    alignItems: 'center',
                }}>
                <View style={{ rowGap: spacing.m, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShowViewer(true, message.is_user)}>
                        <Avatar
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: borderRadius.xl,
                                marginLeft: spacing.sm,
                                marginRight: spacing.m,
                            }}
                            targetImage={Characters.getImageDir(imageId)}
                        />
                    </TouchableOpacity>

                    {showMetadata && (
                        <>
                            <Text style={{ color: color.text._400 }}>#{index}</Text>
                            {deltaTime !== undefined && !message.is_user && index !== 0 && (
                                <Text style={{ color: color.text._400 }}>{deltaTime}s</Text>
                            )}
                        </>
                    )}
                </View>
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: spacing.m, alignItems: align }}>
                        <Text
                            style={{
                                fontSize: fontSize.l,
                                color: color.text._100,
                                marginRight: spacing.sm,
                            }}>
                            {message.name}
                        </Text>
                        {showMetadata && (
                            <Text style={{ fontSize: fontSize.s, color: color.text._400 }}>
                                {swipe.gen_finished.toLocaleTimeString()}
                            </Text>
                        )}
                    </View>
                </View>
                {children}
            </View>
        </View>
    )
}

export default ChatFrame
