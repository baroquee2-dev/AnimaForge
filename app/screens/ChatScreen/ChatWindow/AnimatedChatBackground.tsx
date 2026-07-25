import { ImageBackground } from 'expo-image'
import { ReactNode, useEffect, useState } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated'

type AnimatedChatBackgroundProps = {
    uri: string
    style?: ViewStyle
    children?: ReactNode
}

const AnimatedChatBackground: React.FC<AnimatedChatBackgroundProps> = ({
    uri,
    style,
    children,
}) => {
    const [displayUri, setDisplayUri] = useState(uri)
    const opacity = useSharedValue(1)

    useEffect(() => {
        if (!uri) {
            setDisplayUri('')
            opacity.value = 1
            return
        }

        if (!displayUri) {
            setDisplayUri(uri)
            return
        }

        if (uri === displayUri) return

        opacity.value = withTiming(0, { duration: 180 }, (finished) => {
            if (!finished) return
            runOnJS(setDisplayUri)(uri)
            opacity.value = withTiming(1, { duration: 320 })
        })
    }, [uri, displayUri, opacity])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }))

    return (
        <View style={[{ flex: 1 }, style]}>
            {!!displayUri && (
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, animatedStyle]}>
                    <ImageBackground
                        cachePolicy="none"
                        style={{ flex: 1 }}
                        source={{ uri: displayUri }}
                    />
                </Animated.View>
            )}
            {children}
        </View>
    )
}

export default AnimatedChatBackground
