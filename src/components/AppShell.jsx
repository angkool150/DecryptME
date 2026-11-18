'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AppLayout from './AppLayout.jsx'
import { getToken } from '../lib/api.js'

function activeItemFor(pathname) {
    if (pathname === '/' || pathname === '') return 'Dashboard'
    if (pathname.startsWith('/challenges')) return 'Challenges'
    if (pathname.startsWith('/leaderboard')) return 'Leaderboard'
    if (pathname.startsWith('/profile')) return 'Profile'
    if (pathname.startsWith('/admin')) return 'Admin'
    return 'Dashboard'
}

// Client-side auth gate kept from the original SPA: the JWT lives in
// localStorage and is sent as an Authorization header by the API client.
export default function AppShell({ children }) {
    const pathname = usePathname() || '/'
    const router = useRouter()
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!getToken()) {
            router.replace('/login')
            return
        }
        setReady(true)
    }, [router, pathname])

    if (!ready) {
        return <div className="min-h-svh bg-void" aria-busy="true" />
    }

    return <AppLayout activeItem={activeItemFor(pathname)}>{children}</AppLayout>
}
