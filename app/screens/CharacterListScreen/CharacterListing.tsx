import { StyleSheet, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, { SlideInLeft, Easing } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import Avatar from '@components/views/Avatar'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Characters, CharInfo } from '@lib/state/Characters'
import { CharacterSorter } from '@lib/state/CharacterSorter'
import { Theme } from '@lib/theme/ThemeManager'
import { getFriendlyTimeStamp } from '@lib/utils/Time'

import CharacterEditPopup from './CharacterEditPopup'
import CharacterListingTags from './CharacterListingTags'

type CharacterListingProps = {
    character: CharInfo
    nowLoading: boolean
    setNowLoading: (b: boolean) => void
    index: number
}

const STAGGER_CAP = 14
const STAGGER_STEP_MS = 30

const CharacterListing: React.FC<CharacterListingProps> = ({
    character,
    nowLoading,
    setNowLoading,
    index,
}) => {
    const [showTags] = useMMKVBoolean(AppSettings.ShowTags)
    const { setShowSearch, setTagFilter, tagFilter } = CharacterSorter.useSorterStore(
        useShallow((state) => ({
            setShowSearch: state.setShowSearch,
            setTagFilter: state.setTagFilter,
            tagFilter: state.tagFilter,
        }))
    )
    const styles = useStyles()

    const getPreviewText = () => {
        if (character.latestSwipe === undefined || !character.latestName) return 'No Messages'
        return character.latestName + ':  ' + character.latestSwipe.trim()
    }

    return (
        <Animated.View
            entering={SlideInLeft.duration(320 + Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS)
                .delay(Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS)
                .easing(Easing.out(Easing.cubic))}>
            <CharacterEditPopup
                character={character}
                setNowLoading={setNowLoading}
                nowLoading={nowLoading}>
                <View style={styles.longButtonContainer}>
                    <Avatar
                        targetImage={Characters.getImageDir(character.image_id)}
                        style={styles.avatar}
                    />

                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.nametag} numberOfLines={2}>
                                {character.name}
                            </Text>
                            <Text style={styles.timestamp}>
                                {getFriendlyTimeStamp(character.last_modified)}
                            </Text>
                        </View>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.previewText}>
                            {getPreviewText()}
                        </Text>
                    </View>
                </View>
            </CharacterEditPopup>
            <CharacterListingTags
                tags={character.tags}
                showTags={showTags!}
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

    return StyleSheet.create({
        longButtonContainer: {
            flexDirection: 'row',
            backgroundColor: color.neutral._100,
            borderRadius: borderRadius.m,
            flex: 1,
            paddingVertical: spacing.l,
            paddingHorizontal: spacing.xl,
        },

        avatar: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.l,
            backgroundColor: color.neutral._200,
            borderColor: color.neutral._200,
            borderWidth: 1,
        },

        nametag: {
            flex: 1,
            fontSize: fontSize.l,
            fontWeight: '500',
            color: color.text._100,
        },

        timestamp: {
            fontSize: fontSize.s,
            color: color.text._400,
        },

        previewText: {
            marginTop: spacing.s,
            color: color.text._500,
        },
    })
}
