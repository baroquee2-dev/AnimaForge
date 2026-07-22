import { Stack } from 'expo-router'
import { ReactNode } from 'react'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'

type HeaderTitleProps = {
    title?: string
    headerTitle?: ((props: { children: string; tintColor?: string }) => ReactNode) | undefined
    animation?: NativeStackNavigationOptions['animation']
    screenOptions?: NativeStackNavigationOptions
}

const HeaderTitle: React.FC<HeaderTitleProps> = ({
    title = '',
    headerTitle = undefined,
    animation = 'simple_push',
    screenOptions,
}) => {
    return (
        <Stack.Screen
            options={{
                title: title,
                headerTitle: headerTitle,
                animation: animation,
                ...screenOptions,
            }}
        />
    )
}

export default HeaderTitle
