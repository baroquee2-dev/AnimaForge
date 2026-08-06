import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useMMKVBoolean } from 'react-native-mmkv'
import { SafeAreaView } from 'react-native-safe-area-context'

import ThemedSwitch from '@components/input/ThemedSwitch'
import HeaderTitle from '@components/views/HeaderTitle'
import { AppSettings } from '@lib/constants/GlobalValues'

const CharacterMemoryScreen = () => {
    const { t } = useTranslation()
    const [autoSummary, setAutoSummary] = useMMKVBoolean(AppSettings.AutoSummary)

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            <HeaderTitle title={t('nav.characterMemory')} />
            <KeyboardAwareScrollView style={{ paddingHorizontal: 16 }}>
                <ThemedSwitch
                    label={t('chat.autoSummary')}
                    description={t('memory.autoSummaryDesc')}
                    value={autoSummary}
                    onChangeValue={setAutoSummary}
                />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}

export default CharacterMemoryScreen
