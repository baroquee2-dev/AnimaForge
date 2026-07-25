import { ImageBackground } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, { SlideInLeft, Easing } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'

import Avatar from '@components/views/Avatar'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Characters, CharInfo } from '@lib/state/Characters'
import { CharacterSorter } from '@lib/state/CharacterSorter'
import { Theme } from '@lib/theme/ThemeManager'
import { getFriendlyTimeStamp } from '@lib/utils/Time'

import CharacterEditPopup from './CharacterEditPopup'
import CharacterListingTags from './CharacterListingTags'

const CARD_BACKGROUND = require('@assets/images/character-card-bg.webp')

type CharacterListingProps = {
    character: CharInfo
    nowLoading: boolean
    setNowLoading: (b: boolean) => void
    index: number
}

const STAGGER_CAP = 14
const STAGGER_STEP_MS = 30
const PORTRAIT_WIDTH = 80
const CARD_INK = {
    title: '#2c2419',
    body: '#4a4036',
    muted: '#6b6157',
    faint: '#8a8076',
}

const CharacterListing: React.FC<CharacterListingProps> = ({
    character,
    nowLoading,
    setNowLoading,
    index,
}) => {
    const { t } = useTranslation()
    const [showTags] = useMMKVBoolean(AppSettings.ShowTags)
    const { setShowSearch, setTagFilter, tagFilter } = CharacterSorter.useSorterStore(
        useShallow((state) => ({
            setShowSearch: state.setShowSearch,
            setTagFilter: state.setTagFilter,
            tagFilter: state.tagFilter,
        }))
    )
    const { styles, tagInsetLeft } = useStyles()

    const description = character.description.trim()
    const latestMessage =
        character.latestSwipe && character.latestName
            ? character.latestSwipe.trim()
            : undefined

    return (
        <Animated.View
            entering={SlideInLeft.duration(320 + Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS)
                .delay(Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS)
                .easing(Easing.out(Easing.cubic))}>
            <CharacterEditPopup
                character={character}
                setNowLoading={setNowLoading}
                nowLoading={nowLoading}>
                <View style={styles.cardOuter}>
                    <ImageBackground
                        source={CARD_BACKGROUND}
                        contentFit="fill"
                        style={styles.cardBackground}
                        imageStyle={styles.cardBackgroundImage}>
                        <View style={styles.cardContent}>
                            <Avatar
                                contentFit="cover"
                                targetImage={Characters.getImageDir(character.image_id)}
                                style={styles.portrait}
                            />

                            <View style={styles.textColumn}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {character.name}
                                    </Text>
                                    <Text style={styles.timestamp}>
                                        {getFriendlyTimeStamp(character.last_modified)}
                                    </Text>
                                </View>

                                {description.length > 0 && (
                                    <Text
                                        style={styles.description}
                                        numberOfLines={2}
                                        ellipsizeMode="tail">
                                        {description}
                                    </Text>
                                )}

                                {latestMessage ? (
                                    <View style={styles.messagePanel}>
                                        <Text
                                            style={styles.latestMessage}
                                            numberOfLines={2}
                                            ellipsizeMode="tail">
                                            {latestMessage}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.messagePanel}>
                                        <Text style={styles.latestPlaceholder} numberOfLines={1}>
                                            {t('characterList.noChats')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </ImageBackground>
                </View>
            </CharacterEditPopup>
            <CharacterListingTags
                tags={character.tags}
                showTags={showTags!}
                contentInsetLeft={tagInsetLeft}
                onPress={(tag: string) => {
                    setShowSearch(true)
                    if (tagFilter.includes(tag)) return
                    setTagFilter([...tagFilter, tag])
                }}
            />
        </Animated.View>
    )
}

export default CharacterListing

const useStyles = () => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()
    const cardPadding = spacing.l
    const tagInsetLeft = cardPadding + PORTRAIT_WIDTH + spacing.m

    return {
        tagInsetLeft,
        styles: StyleSheet.create({
        cardOuter: {
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
            backgroundColor: '#f5efe6',
            shadowColor: color.shadow,
            boxShadow: [
                {
                    offsetX: 0,
                    offsetY: 4,
                    spreadDistance: 0,
                    color: color.shadow,
                    blurRadius: 10,
                },
            ],
        },
        cardBackground: {
            width: '100%',
        },
        cardBackgroundImage: {
            borderRadius: borderRadius.xl,
        },
        cardContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: spacing.l,
            paddingHorizontal: cardPadding,
            columnGap: spacing.m,
            minHeight: 132,
        },
        portrait: {
            width: PORTRAIT_WIDTH,
            height: 106,
            borderRadius: borderRadius.m,
            backgroundColor: '#f5efe6',
            borderColor: '#9a8570',
            borderWidth: 1,
        },
        textColumn: {
            flex: 1,
            rowGap: spacing.xs,
            paddingTop: 2,
        },
        nameRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            columnGap: spacing.sm,
        },
        name: {
            flex: 1,
            fontSize: fontSize.xl,
            fontWeight: '700',
            color: CARD_INK.title,
        },
        timestamp: {
            fontSize: fontSize.s,
            color: CARD_INK.faint,
            marginTop: 2,
        },
        description: {
            fontSize: fontSize.s,
            color: CARD_INK.muted,
            lineHeight: Math.round(fontSize.s * 1.45),
        },
        messagePanel: {
            marginTop: spacing.xs,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            borderRadius: borderRadius.s,
            paddingHorizontal: spacing.m,
            paddingVertical: spacing.sm,
        },
        latestMessage: {
            fontSize: fontSize.m,
            color: CARD_INK.body,
            lineHeight: Math.round(fontSize.m * 1.4),
        },
        latestPlaceholder: {
            fontSize: fontSize.s,
            color: CARD_INK.faint,
            fontStyle: 'italic',
        },
        }),
    }
}
