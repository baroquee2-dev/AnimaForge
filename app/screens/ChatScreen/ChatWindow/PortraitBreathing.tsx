import { ReactNode, useEffect } from 'react'
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'

type PortraitBreathingProps = {
    active: boolean
    children: ReactNode
}

const PortraitBreathing: React.FC<PortraitBreathingProps> = ({ active, children }) => {
    const scale = useSharedValue(1)

    useEffect(() => {
        if (active) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            )
        } else {
            scale.value = withTiming(1, { duration: 300 })
        }
    }, [active, scale])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }))

    return <Animated.View style={animatedStyle}>{children}</Animated.View>
}

export default PortraitBreathing
