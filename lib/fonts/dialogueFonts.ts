const NOTO_BY_WEIGHT: Record<number, string> = {
    100: 'NotoSansSC_100Thin',
    200: 'NotoSansSC_200ExtraLight',
    300: 'NotoSansSC_300Light',
    400: 'NotoSansSC_400Regular',
    500: 'NotoSansSC_500Medium',
    600: 'NotoSansSC_600SemiBold',
    700: 'NotoSansSC_700Bold',
    800: 'NotoSansSC_800ExtraBold',
    900: 'NotoSansSC_900Black',
}

const NOTO_WEIGHT_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

export const getNotoFontFamilyForWeight = (weight: number): string => {
    const clamped = Math.max(100, Math.min(900, weight))
    const nearest = NOTO_WEIGHT_STEPS.reduce((best, step) =>
        Math.abs(step - clamped) < Math.abs(best - clamped) ? step : best
    )
    return NOTO_BY_WEIGHT[nearest]
}
