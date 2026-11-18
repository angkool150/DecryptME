import { useCallback, useEffect, useRef, useState } from 'react'

export function useReloadToken() {
    const [token, setToken] = useState(0)
    const refresh = useCallback(() => setToken((value) => value + 1), [])
    return [token, refresh]
}

export function useDebouncedEffect(effect, deps, delay = 220) {
    const effectRef = useRef(effect)

    useEffect(() => {
        effectRef.current = effect
    }, [effect])

    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(() => effectRef.current(controller.signal), delay)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay])
}
