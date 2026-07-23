import { Dimensions } from 'react-native'

/** Space reserved for name tag, swipe bar, and padding above the input field. */
const DIALOGUE_CHROME_HEIGHT = 108
const MAX_HEIGHT_RATIO = 0.2
const MIN_HEIGHT = 64

/** Full-screen portrait scale (1 = fit, >1 = zoom in / crop edges). */
export const IMMERSIVE_PORTRAIT_ZOOM = 1.05

/** Approximate native header body height below the status bar. */
export const IMMERSIVE_HEADER_BODY_HEIGHT = 44

/** Dialogue box width as a fraction of the screen (left-aligned). */
export const IMMERSIVE_DIALOGUE_WIDTH_RATIO = 0.88

export const IMMERSIVE_DIALOGUE_LEFT_PADDING = 12

export const getImmersiveDialogueWidth = () =>
    `${Math.round(IMMERSIVE_DIALOGUE_WIDTH_RATIO * 100)}%` as `${number}%`

export const getImmersiveDialogueMaxHeight = (inputHeight: number = 64) => {
    const { height: screenHeight } = Dimensions.get('window')
    const cap = Math.floor(screenHeight * MAX_HEIGHT_RATIO)
    const remaining = screenHeight - inputHeight - DIALOGUE_CHROME_HEIGHT
    return Math.max(MIN_HEIGHT, Math.min(cap, remaining))
}
