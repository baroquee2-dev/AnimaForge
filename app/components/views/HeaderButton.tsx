import { Stack } from 'expo-router'
import { ReactNode } from 'react'
import type { NativeStackNavigationOptions } from 'expo-router'

type HeaderButtonProps = {
    headerRight?: () => ReactNode
    headerLeft?: () => ReactNode
    screenOptions?: NativeStackNavigationOptions
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ screenOptions, ...rest }) => {
    return <Stack.Screen options={{ ...rest, ...screenOptions }} />
}

export default HeaderButton
