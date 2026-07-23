import { MaterialIcons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, Linking, Pressable, Text, View } from 'react-native'
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import BottomSheet from '@components/views/BottomSheet'
import { APIConfiguration } from '@lib/engine/API/APIBuilder.types'
import { APIManager } from '@lib/engine/API/APIManagerState'
import { Theme } from '@lib/theme/ThemeManager'

type TemplatePickerProps = {
    visible: boolean
    setVisible: (visible: boolean) => void
    setPending: (index: number) => void
}

const vendorIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    openai: 'smart-toy',
    gear: 'settings',
    lightning: 'flash-on',
    ollama: 'pets',
    claude: 'psychology',
    cohere: 'hub',
    openrouter: 'router',
    googleai: 'cloud',
    link: 'link',
}

const VendorIcon = ({ icon, color }: { icon: string; color: string }) => {
    const materialIcon = vendorIcons[icon] ?? vendorIcons.link
    return <MaterialIcons name={materialIcon} size={24} color={color} />
}

const TemplateItem: React.FC<{
    config: APIConfiguration
    onPress: () => void
    selected: boolean
}> = ({ config, onPress, selected }) => {
    const { color, borderWidth, spacing, fontSize } = Theme.useTheme()

    const activeProgress = useSharedValue(selected ? 1 : 0)

    useEffect(() => {
        activeProgress.value = withTiming(selected ? 1 : 0, {
            duration: 200,
        })
    }, [activeProgress, selected])

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            activeProgress.value,
            [0, 1],
            [color.neutral._200, color.primary._500]
        ),
    }))

    const icon = config.ui.display?.icon ?? 'link'
    const name = config.ui.display?.name ?? config.name
    const description = config.ui.display?.description
    const link = config.ui.display?.link

    return (
        <Animated.View
            style={[
                {
                    borderWidth: borderWidth.m,
                    borderRadius: spacing.xl,
                },
                animatedStyle,
            ]}>
            <Pressable
                style={{
                    minHeight: 64,
                    paddingLeft: spacing.xl,
                    paddingRight: spacing.xl,
                    paddingVertical: spacing.m,
                    alignItems: 'center',
                    flexDirection: 'row',
                    columnGap: 12,
                    flex: 1,
                }}
                onPress={onPress}>
                <VendorIcon icon={icon} color={color.text._400} />
                <View style={{ flex: 1 }}>
                    <Text style={{ color: color.text._100, fontSize: fontSize.l }}>{name}</Text>
                    {description && <Text style={{ color: color.text._400 }}>{description}</Text>}
                </View>
                {link && (
                    <Pressable onPress={() => Linking.openURL(link)}>
                        <MaterialIcons name="info-outline" color={color.text._400} size={20} />
                    </Pressable>
                )}
            </Pressable>
        </Animated.View>
    )
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ visible, setVisible, setPending }) => {
    const [selected, setSelected] = useState<number | undefined>()
    const { color, fontSize, spacing } = Theme.useTheme()
    const { addValue, getTemplates, valuesLength } = APIManager.useConnectionsStore(
        useShallow((state) => ({
            addValue: state.addValue,
            getTemplates: state.getTemplates,
            valuesLength: state.values.length,
        }))
    )

    const templates = useMemo(
        () =>
            getTemplates().sort(
                (a, b) => (b.ui.display?.priority ?? 0) - (a.ui.display?.priority ?? 0)
            ),
        [getTemplates]
    )

    const handleClose = () => {
        setSelected(undefined)
        setVisible(false)
    }

    return (
        <BottomSheet
            visible={visible}
            setVisible={setVisible}
            onClose={() => setSelected(undefined)}
            sheetStyle={{ maxHeight: '80%' }}>
            <Text
                style={{
                    color: color.text._100,
                    paddingBottom: spacing.xl,
                    fontSize: fontSize.xl,
                }}>
                Add Connection
            </Text>
            <FlatList
                data={templates}
                keyExtractor={(item) => item.name}
                renderItem={({ item, index }) => (
                    <TemplateItem
                        config={item}
                        selected={selected === index}
                        onPress={() => {
                            setSelected(selected === index ? undefined : index)
                        }}
                    />
                )}
                contentContainerStyle={{
                    rowGap: 8,
                    paddingBottom: 32,
                }}
                showsVerticalScrollIndicator={false}
            />

            <View style={{ paddingTop: 12 }}>
                <ThemedButton
                    disabled={selected === undefined}
                    label="Create"
                    onPress={() => {
                        if (selected === undefined) return
                        const template = templates.at(selected)
                        if (!template) return
                        addValue({
                            ...template.defaultValues,
                            active: true,
                            configName: template.name,
                            friendlyName: 'New API',
                        })
                        setPending(valuesLength)
                        handleClose()
                    }}
                    variant={selected === undefined ? 'disabled' : 'primary'}
                />
            </View>
        </BottomSheet>
    )
}

export default TemplatePicker
