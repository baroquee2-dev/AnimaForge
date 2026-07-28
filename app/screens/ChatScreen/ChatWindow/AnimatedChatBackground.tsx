import { ImageBackground } from 'expo-image'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

type AnimatedChatBackgroundProps = {
    uri: string
    style?: ViewStyle
    children?: ReactNode
}

/**
 * Chat background layer. Instant swap (no Reanimated crossfade) — combining
 * fades with portrait remounts crashed on Android when both media changed
 * while chat was under the character editor.
 */
const AnimatedChatBackground: React.FC<AnimatedChatBackgroundProps> = ({
    uri,
    style,
    children,
}) => {
    const [displayUri, setDisplayUri] = useState(uri)
    const displayUriRef = useRef(uri)

    useEffect(() => {
        if (uri === displayUriRef.current) return
        displayUriRef.current = uri
        setDisplayUri(uri)
    }, [uri])

    return (
        <View style={[{ flex: 1 }, style]}>
            {!!displayUri && (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <ImageBackground
                        cachePolicy="none"
                        style={{ flex: 1 }}
                        source={{ uri: displayUri }}
                    />
                </View>
            )}
            {children}
        </View>
    )
}

export default AnimatedChatBackground
