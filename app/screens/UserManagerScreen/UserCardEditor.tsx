import { AntDesign } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { useNavigation } from 'expo-router'
import { usePreventRemove } from '@react-navigation/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import ThemedTextInput from '@components/input/ThemedTextInput'
import Alert from '@components/views/Alert'
import Avatar from '@components/views/Avatar'
import AvatarViewer from '@components/views/AvatarViewer'
import ContextMenu from '@components/views/ContextMenu'
import { CharacterCardData, Characters } from '@lib/state/Characters'
import { useAvatarViewerStore } from '@lib/state/components/AvatarViewer'
import { Theme } from '@lib/theme/ThemeManager'

const UserCardEditor = () => {
    const { t } = useTranslation()
    const styles = useStyles()
    const { color, spacing } = Theme.useTheme()
    const navigation = useNavigation()
    const [edited, setEdited] = useState(false)

    const { userCard, imageID, id, setCard, updateImage } = Characters.useUserStore(
        useShallow((state) => ({
            userCard: state.card,
            imageID: state.card?.image_id ?? 0,
            id: state.id,
            setCard: state.setCard,
            updateImage: state.updateImage,
        }))
    )

    const [currentCard, setCurrentCard] = useState<CharacterCardData | undefined>(userCard)

    const setShowViewer = useAvatarViewerStore((state) => state.setShow)

    useEffect(() => {
        setCurrentCard(userCard)
        setEdited(false)
    }, [userCard])

    const updateCard = (card: CharacterCardData) => {
        setEdited(true)
        setCurrentCard(card)
    }

    const handleSaveCard = async () => {
        if (currentCard && id) {
            await Characters.db.mutate.updateCard(currentCard, id)
            setEdited(false)
            setCard(id)
        }
    }

    const handleUploadImage = () => {
        DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: 'image/*',
        }).then((result) => {
            if (result.canceled) return
            if (id) updateImage(result.assets[0].uri)
        })
    }

    const handleDeleteImage = () => {
        Alert.alert({
            title: t('common.deleteImageTitle'),
            description: t('common.deleteImageDesc'),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('common.deleteImageConfirm'),
                    onPress: () => {
                        Characters.deleteImage(imageID)
                    },
                    type: 'warning',
                },
            ],
        })
    }

    usePreventRemove(edited, ({ data }) => {
        if (!userCard) return
        Alert.alert({
            title: t('common.unsavedTitle'),
            description: t('common.unsavedDesc'),
            buttons: [
                { label: t('common.cancel') },
                {
                    label: t('common.save'),
                    onPress: async () => {
                        await handleSaveCard()
                        navigation.dispatch(data.action)
                    },
                },
                {
                    label: t('common.discardChanges'),
                    onPress: () => {
                        navigation.dispatch(data.action)
                    },
                    type: 'warning',
                },
            ],
        })
    })

    return (
        <View style={styles.userContainer}>
            <AvatarViewer editorButton={false} />
            <View style={styles.nameBar}>
                <ContextMenu
                    placement="right"
                    buttons={[
                        {
                            label: t('common.changeImage'),
                            icon: 'picture',
                            onPress: (close) => {
                                close()
                                handleUploadImage()
                            },
                        },
                        {
                            label: t('common.viewImage'),
                            icon: 'search',
                            onPress: (close) => {
                                close()
                                setShowViewer(true, true)
                            },
                        },
                        {
                            label: t('common.deleteImage'),
                            icon: 'delete',
                            onPress: (close) => {
                                close()
                                handleDeleteImage()
                            },
                            variant: 'warning',
                        },
                    ]}>
                    <Avatar
                        targetImage={Characters.getImageDir(imageID)}
                        style={styles.userImage}
                    />
                    <AntDesign name="edit" color={color.text._100} style={styles.editHover} />
                </ContextMenu>
                <View style={{ marginLeft: spacing.xl2, rowGap: 12, flex: 1 }}>
                    <ThemedButton
                        disabled={!edited}
                        iconName="save"
                        iconSize={20}
                        label={t('common.save')}
                        onPress={handleSaveCard}
                        variant={edited ? 'secondary' : 'disabled'}
                    />
                    <ThemedTextInput
                        style={{ height: 36 }}
                        label={t('userManager.name')}
                        value={currentCard?.name ?? ''}
                        onChangeText={(text) => {
                            if (currentCard)
                                updateCard({
                                    ...currentCard,
                                    name: text,
                                })
                        }}
                        placeholder={t('userManager.namePlaceholder')}
                    />
                </View>
            </View>
            <ThemedTextInput
                multiline
                containerStyle={{
                    marginHorizontal: 16,
                }}
                style={{
                    backgroundColor: color.neutral._100,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                }}
                numberOfLines={10}
                label={t('userManager.description')}
                value={currentCard?.description ?? ''}
                onChangeText={(text) => {
                    if (currentCard)
                        updateCard({
                            ...currentCard,
                            description: text,
                        })
                }}
                placeholder={t('userManager.descriptionPlaceholder')}
            />
        </View>
    )
}

export default UserCardEditor

const useStyles = () => {
    const { color, spacing, borderWidth, borderRadius } = Theme.useTheme()

    return StyleSheet.create({
        userContainer: {
            flex: 1,
            paddingHorizontal: spacing.m,
            paddingTop: spacing.m,
            paddingBottom: spacing.s,
            rowGap: 12,
        },

        nameBar: {
            alignContent: 'flex-start',
            borderRadius: borderRadius.xl,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: color.neutral._100,
            paddingVertical: 12,
            paddingHorizontal: 12,
        },

        userImage: {
            width: 84,
            height: 84,
            borderRadius: borderRadius.xl2,
            borderColor: color.primary._500,
            borderWidth: borderWidth.m,
        },

        editHover: {
            position: 'absolute',
            left: '75%',
            top: '75%',
            padding: spacing.m,
            borderColor: color.primary._500,
            borderWidth: borderWidth.s,
            backgroundColor: color.neutral._200,
            borderRadius: spacing.l,
        },
    })
}
