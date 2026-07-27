import { useIsFocused } from 'expo-router'
import { useEffect, useRef, useState } from 'react'

type UseFocusedValueOptions = {
    /** When regaining focus with a pending change, wait before applying live value. */
    resumeDelayMs?: number
}

/**
 * While unfocused, freeze the last focused value.
 * On resume, optionally delay applying the live value so portrait + background
 * updates are staggered (avoids dual expo-image/Reanimated remount crash).
 */
export function useFocusedValue<T>(
    value: T,
    _label?: string,
    options?: UseFocusedValueOptions
): T {
    const isFocused = useIsFocused()
    const resumeDelayMs = options?.resumeDelayMs ?? 0
    const [displayed, setDisplayed] = useState(value)
    const displayedRef = useRef(value)
    const wasFocusedRef = useRef(isFocused)
    const pendingResumeRef = useRef(false)

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined

        const apply = (next: T) => {
            displayedRef.current = next
            setDisplayed(next)
            pendingResumeRef.current = false
        }

        if (!isFocused) {
            wasFocusedRef.current = false
            pendingResumeRef.current = false
            return
        }

        const justFocused = !wasFocusedRef.current
        wasFocusedRef.current = true

        if (displayedRef.current === value) {
            pendingResumeRef.current = false
            return
        }

        if (justFocused && resumeDelayMs > 0) {
            pendingResumeRef.current = true
            timer = setTimeout(() => apply(value), resumeDelayMs)
            return () => clearTimeout(timer)
        }

        if (!pendingResumeRef.current) {
            apply(value)
        } else {
            timer = setTimeout(() => apply(value), resumeDelayMs)
            return () => clearTimeout(timer)
        }
    }, [isFocused, value, resumeDelayMs])

    return displayed
}
