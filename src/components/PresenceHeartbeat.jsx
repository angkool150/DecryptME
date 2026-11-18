'use client'

import { useEffect } from 'react'
import { getToken } from '../lib/api.js'
import { activityForPath } from '../lib/presence.js'

function sendHeartbeat() {
    const token = getToken()
    if (!token) return

    const path = window.location.pathname || '/'
    fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ path, activity: activityForPath(path) }),
        keepalive: true,
    }).catch(() => {
        // Presence is best-effort; never interrupt the page for a failed beat.
    })
}

function PresenceHeartbeat({ activeItem }) {
    useEffect(() => {
        const token = getToken()
        if (!token) return undefined

        sendHeartbeat()

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') sendHeartbeat()
        }, 30000)

        function handleVisible() {
            if (document.visibilityState === 'visible') sendHeartbeat()
        }

        function handleNavigation() {
            sendHeartbeat()
        }

        document.addEventListener('visibilitychange', handleVisible)
        window.addEventListener('popstate', handleNavigation)

        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisible)
            window.removeEventListener('popstate', handleNavigation)
        }
    }, [activeItem])

    return null
}

export default PresenceHeartbeat
