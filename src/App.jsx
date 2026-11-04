import { useEffect, useState } from 'react'
import AppLayout from './components/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Challenges from './pages/Challenges.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Profile from './pages/Profile.jsx'

const PAGES = {
    '/challenges': { Page: Challenges, activeItem: 'Challenges' },
    '/leaderboard': { Page: Leaderboard, activeItem: 'Leaderboard' },
    '/profile': { Page: Profile, activeItem: 'Profile' },
}

function getPage() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/'
    return PAGES[path] ?? { Page: Dashboard, activeItem: 'Dashboard' }
}

function App() {
    const [page, setPage] = useState(getPage)

    useEffect(() => {
        function syncPage() {
            setPage(getPage())
        }

        window.addEventListener('popstate', syncPage)
        return () => window.removeEventListener('popstate', syncPage)
    }, [])

    useEffect(() => {
        const id = window.location.hash.slice(1)
        const target = id ? document.getElementById(id) : null

        if (target) {
            const frame = window.requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth' })
            })
            return () => window.cancelAnimationFrame(frame)
        }

        window.scrollTo({ top: 0 })
    }, [page])

    const { Page, activeItem } = page

    return (
        <AppLayout activeItem={activeItem}>
            <Page />
        </AppLayout>
    )
}

export default App
