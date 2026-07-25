import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

import Drawer from '@components/views/Drawer'

import UserCardEditor from './UserCardEditor'
import UserDrawer from './UserDrawer'

const UserManagerScreen = () => {
    const { t } = useTranslation()

    return (
        <Drawer.Gesture
            config={[
                { drawerID: Drawer.ID.USERLIST, openDirection: 'left', closeDirection: 'right' },
            ]}>
            <SafeAreaView
                edges={['bottom']}
                style={{
                    flex: 1,
                }}>
                <Stack.Screen
                    options={{
                        title: t('userManager.title'),
                        animation: 'simple_push',
                        headerRight: () => <Drawer.Button drawerID={Drawer.ID.USERLIST} />,
                    }}
                />
                <UserCardEditor />
                <UserDrawer />
            </SafeAreaView>
        </Drawer.Gesture>
    )
}

export default UserManagerScreen
