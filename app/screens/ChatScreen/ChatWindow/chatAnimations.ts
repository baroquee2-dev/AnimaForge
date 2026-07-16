import { Easing, FadeIn, FadeInDown } from 'react-native-reanimated'

export const DRAWER_ITEM_STAGGER_CAP = 12
export const DRAWER_ITEM_STAGGER_MS = 35

export const drawerItemEntrance = (index: number) =>
    FadeIn.duration(260)
        .delay(Math.min(index, DRAWER_ITEM_STAGGER_CAP) * DRAWER_ITEM_STAGGER_MS)
        .easing(Easing.out(Easing.cubic))

export const portraitEntrance = FadeInDown.duration(380)
    .delay(100)
    .springify()
    .damping(18)
    .stiffness(140)
