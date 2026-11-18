'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setRouter } from '../navigation.js'

// Registers the Next App Router so legacy navigate() calls stay client-side.
export default function NavigationBridge() {
    const router = useRouter()

    useEffect(() => {
        setRouter(router)
    }, [router])

    return null
}
