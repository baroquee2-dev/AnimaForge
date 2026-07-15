import { ReactNode, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import { useInference } from '@lib/state/Chat'
import { useChatInputTextStore } from '@lib/state/components/ChatInput'
import { useTTSStore } from '@lib/state/TTS'
import { Theme } from '@lib/theme/ThemeManager'

type PortraitAnimationProps = {
    children: ReactNode
}

const PortraitAnimation: React.FC<PortraitAnimationProps> = ({ children }) => {
    const { color } = Theme.useTheme()
    const nowGenerating = useInference((state) => state.nowGenerating)
    const inputFocused = useChatInputTextStore((state) => state.inputFocused)
    const ttsActive = useTTSStore(
        useShallow((state) => state.enabled && state.activeChatIndex !== undefined)
    )

    const baseScale = useSharedValue(1)
    const breathScale = useSharedValue(1)
    const rotate = useSharedValue(0)
    const translateX = useSharedValue(0)
    const glowOpacity = useSharedValue(0)

    const prevGenerating = useRef(nowGenerating)

    useEffect(() => {
        if (nowGenerating) {
            breathScale.value = withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            )
        } else {
            breathScale.value = withTiming(1, { duration: 300 })
        }
    }, [nowGenerating, breathScale])

    useEffect(() => {
        if (prevGenerating.current && !nowGenerating) {
            baseScale.value = withSequence(
                withTiming(1.05, { duration: 180, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) })
            )
            glowOpacity.value = withSequence(
                withTiming(0.4, { duration: 120 }),
                withTiming(0, { duration: 550 })
            )
        }
        prevGenerating.current = nowGenerating
    }, [nowGenerating, baseScale, glowOpacity])

    useEffect(() => {
        if (ttsActive) {
            translateX.value = withRepeat(
                withSequence(
                    withTiming(4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            )
        } else {
            translateX.value = withTiming(0, { duration: 300 })
        }
    }, [ttsActive, translateX])

    useEffect(() => {
        if (inputFocused && !nowGenerating) {
            rotate.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-1.2, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            )
        } else {
            rotate.value = withTiming(0, { duration: 300 })
        }
    }, [inputFocused, nowGenerating, rotate])

    useEffect(() => {
        if (nowGenerating || ttsActive) return

        const scheduleBlink = () => {
            const delay = 5000 + Math.random() * 5000
            return setTimeout(() => {
                baseScale.value = withSequence(
                    withTiming(0.988, { duration: 90 }),
                    withTiming(1, { duration: 140 })
                )
                idleTimer = scheduleBlink()
            }, delay)
        }

        let idleTimer = scheduleBlink()
        return () => clearTimeout(idleTimer)
    }, [nowGenerating, ttsActive, baseScale])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
            { scale: baseScale.value * breathScale.value },
        ],
    }))

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }))

    return (
        <View style={styles.container}>
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.glow,
                    {
                        backgroundColor: color.primary._400,
                        borderRadius: 9999,
                    },
                    glowStyle,
                ]}
            />
            <Animated.View style={animatedStyle}>{children}</Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ scale: 1.04 }],
    },
})

export default PortraitAnimation
