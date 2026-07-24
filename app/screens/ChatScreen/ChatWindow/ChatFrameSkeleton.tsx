import React from 'react'
import { View } from 'react-native'

import {
    useIsImmersivePresentation,
    useIsVisualNovelPresentation,
} from '@lib/chat/ChatLayoutContext'
import { Theme } from '@lib/theme/ThemeManager'

type ChatFrameSkeletonProps = {
    index: number
    isUser?: boolean
    estimatedHeight?: number
    isLastMessage: boolean
    historyCompact?: boolean
    portraitExternal?: boolean
}

const ChatFrameSkeleton: React.FC<ChatFrameSkeletonProps> = ({
    index,
    isUser = false,
    estimatedHeight = 48,
    isLastMessage,
    historyCompact = false,
    portraitExternal = false,
}) => {
    const { color, spacing, borderRadius } = Theme.useTheme()
    const isVisualNovel = useIsVisualNovelPresentation()
    const isImmersive = useIsImmersivePresentation()
    const useAlternateAlignment = !isVisualNovel && !isImmersive && !historyCompact

    const rowDir = isUser && useAlternateAlignment ? 'row-reverse' : 'row'
    const align = isUser && useAlternateAlignment ? 'flex-end' : 'flex-start'
    const skeletonColor = color.neutral._300 + '33'
    const avatarSize = historyCompact ? 28 : 48

    if ((isVisualNovel || isImmersive) && isLastMessage && !historyCompact) {
        return (
            <View style={{ paddingHorizontal: 8, paddingVertical: 12, rowGap: spacing.m }}>
                {!portraitExternal && (
                    <View
                        style={{
                            alignSelf: 'center',
                            width: '72%',
                            height: 180,
                            borderRadius: borderRadius.l,
                            backgroundColor: skeletonColor,
                        }}
                    />
                )}
                <View
                    style={{
                        width: '100%',
                        height: Math.max(64, estimatedHeight),
                        borderRadius: borderRadius.m,
                        backgroundColor: skeletonColor,
                    }}
                />
            </View>
        )
    }

    return (
        <View style={{ flexDirection: rowDir, marginBottom: 8, paddingHorizontal: 4 }}>
            {!portraitExternal && (
                <View style={{ alignItems: 'center' }}>
                    <View style={{ rowGap: spacing.m, alignItems: 'center' }}>
                        <View
                            style={{
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: borderRadius.xl,
                                marginHorizontal: spacing.sm,
                                opacity: 0.5,
                                backgroundColor: skeletonColor,
                            }}
                        />
                        <View
                            style={{
                                width: 32,
                                height: 12,
                                borderRadius: 8,
                                backgroundColor: skeletonColor,
                            }}
                        />
                    </View>
                </View>
            )}

            <View style={{ flex: 1 }}>
                <View
                    style={{
                        marginBottom: spacing.m,
                        alignItems: align,
                        rowGap: spacing.xs,
                    }}>
                    <View
                        style={{
                            width: 100,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: skeletonColor,
                        }}
                    />
                    <View
                        style={{
                            width: 80,
                            height: 12,
                            borderRadius: 8,
                            backgroundColor: skeletonColor,
                        }}
                    />
                </View>

                <View
                    style={{
                        width: '100%',
                        height: estimatedHeight,
                        borderRadius: 8,
                        backgroundColor: skeletonColor,
                    }}
                />
                {isLastMessage && index !== 0 && (
                    <View
                        style={{
                            marginTop: 8,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: skeletonColor,
                        }}
                    />
                )}
            </View>
        </View>
    )
}

export default ChatFrameSkeleton
