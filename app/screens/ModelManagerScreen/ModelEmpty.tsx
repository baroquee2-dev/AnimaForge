import { AntDesign } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Theme } from '@lib/theme/ThemeManager'

const ModelEmpty = () => {
    const { t } = useTranslation()
    const { color, spacing, fontSize } = Theme.useTheme()
    return (
        <View
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
            }}>
            <AntDesign name="file-unknown" size={60} color={color.text._700} />
            <Text
                style={{
                    color: color.text._700,
                    marginTop: spacing.xl,
                    fontStyle: 'italic',
                    fontSize: fontSize.l,
                }}>
                {t('models.empty')}
            </Text>
        </View>
    )
}

export default ModelEmpty
