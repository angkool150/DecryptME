'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiRequest, clearSession, getStoredUser } from '../../lib/api.js'
import { navigate } from '../../navigation.js'
import { Spinner, ErrorBanner, initials } from './ui.jsx'
import OverviewSection from './OverviewSection.jsx'
import ChallengesSection from './ChallengesSection.jsx'
import SubmissionsSection from './SubmissionsSection.jsx'
import PresenceSection from './PresenceSection.jsx'
import AnnouncementsSection from './AnnouncementsSection.jsx'
import AuditLogsSection from './AuditLogsSection.jsx'
import UsersSection from './UsersSection.jsx'

const SECTIONS = [
    { id: 'overview', label: 'Overview', hint: 'Platform pulse', icon: GridIcon },
    { id: 'challenges', label: 'Challenges', hint: 'Problems & modules', icon: PuzzleIcon },
    { id: 'submissions', label: 'Submissions', hint: 'Solvers & attempts', icon: FlagIcon },
    { id: 'presence', label: 'Online users', hint: 'Heartbeat monitor', icon: PulseIcon },
    { id: 'announcements', label: 'Announcements', hint: 'Student notices', icon: MegaphoneIcon },
    { id: 'audit', label: 'Audit logs', hint: 'Admin trail', icon: ShieldIcon },
    { id: 'users', label: 'Users', hint: 'Roles & access', icon: UsersIcon },
]

function AdminPage() {
    const user = getStoredUser()
    const [active, setActive] = useState('overview')
    const [overview, setOverview] = useState(null)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState('')
    const [refreshing, setRefreshing] = useState(false)

    const loadOverview = useCallback(async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true)
        try {
            const data = await apiRequest('/api/admin/overview')
            setOverview(data)
            setError('')
        } catch (err) {
            setError(err.message)
        } finally {
            setChecking(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadOverview()
    }, [loadOverview])

    async function handleSignOut() {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' })
        } catch {
            // Local sign-out must still work if the network is unavailable.
        }
        clearSession()
        navigate('/login')
        window.location.reload()
    }

    if (checking) {
        return (
            <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8">
                <Spinner label="Verifying administrator access…" />
            </main>
        )
    }

    if (error) {
        return (
            <main className="relative z-10 mx-auto w-full max-w-[720px] flex-1 px-5 pb-14 pt-16 sm:px-8">
                <div className="rounded-2xl border border-red-400/20 bg-[#0b0f0c] p-6">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-red-300/80">Access denied</p>
                    <h1 className="mt-3 text-2xl font-semibold text-white">Administrator access required</h1>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                        {error} Sign in with an administrator account to open this console.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="inline-flex h-9 items-center rounded-lg bg-neon px-3.5 text-[11.5px] font-semibold text-[#04120a]"
                        >
                            Back to dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                clearSession()
                                window.location.href = '/login'
                            }}
                            className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3.5 text-[11.5px] text-white/80"
                        >
                            Sign in again
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    const activeSection = SECTIONS.find((section) => section.id === active) || SECTIONS[0]

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1440px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon/75">Administrator console</p>
                    <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                        Control the arena.
                    </h1>
                    <p className="mt-1.5 text-[12px] text-muted sm:text-[13px]">
                        Manage problems, monitor submissions, and keep the platform healthy.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 sm:flex">
                        <span className="grid size-7 place-items-center rounded-full border border-neon/25 bg-neon/10 font-mono text-[9px] text-neon">
                            {initials(user?.username)}
                        </span>
                        <span>
                            <span className="block text-[11.5px] font-medium text-white">{user?.username || 'admin'}</span>
                            <span className="block font-mono text-[8px] uppercase tracking-[0.12em] text-muted">Administrator</span>
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadOverview(true)}
                        disabled={refreshing}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-[11px] font-medium text-white/75 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                    >
                        <RefreshIcon className={refreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.04] px-3 text-[11px] font-medium text-red-300 transition hover:border-red-400/30"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[228px_minmax(0,1fr)]">
                <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                    <nav aria-label="Admin sections" className="flex min-w-0 gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#080d0a]/85 p-1.5 backdrop-blur-sm lg:flex-col">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon
                            const isActive = section.id === active

                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActive(section.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex min-w-max items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition lg:w-full ${
                                        isActive
                                            ? 'bg-neon/[0.09] text-neon'
                                            : 'text-muted hover:bg-white/[0.04] hover:text-white'
                                    }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span>
                                        <span className="block text-[12px] font-medium">{section.label}</span>
                                        <span className={`mt-0.5 hidden font-mono text-[8px] uppercase tracking-[0.1em] lg:block ${isActive ? 'text-neon/60' : 'text-muted/70'}`}>
                                            {section.hint}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="mt-3 hidden rounded-2xl border border-white/[0.07] bg-[#080d0a]/85 p-3.5 lg:block">
                        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Live platform</p>
                        <div className="mt-3 space-y-2 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted">Online now</span>
                                <span className="font-mono text-neon">{overview?.stats?.online_now ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted">Active challenges</span>
                                <span className="font-mono text-white/80">{overview?.stats?.challenges_active ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted">Flag attempts</span>
                                <span className="font-mono text-white/80">{overview?.stats?.attempts_total ?? 0}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-2 py-2 text-[10.5px] text-muted transition hover:text-white"
                        >
                            Back to platform
                        </button>
                    </div>
                </aside>

                <div className="min-w-0">
                    {error ? <ErrorBanner message={error} /> : null}

                    {active === 'overview' ? (
                        <OverviewSection overview={overview} onNavigate={setActive} refreshing={refreshing} />
                    ) : null}
                    {active === 'challenges' ? <ChallengesSection onDataChanged={() => loadOverview(true)} /> : null}
                    {active === 'submissions' ? <SubmissionsSection /> : null}
                    {active === 'presence' ? <PresenceSection /> : null}
                    {active === 'announcements' ? <AnnouncementsSection onDataChanged={() => loadOverview(true)} /> : null}
                    {active === 'audit' ? <AuditLogsSection /> : null}
                    {active === 'users' ? <UsersSection onDataChanged={() => loadOverview(true)} /> : null}

                    <p className="mt-4 text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-muted/50">
                        {activeSection.label} · administrator actions are audited
                    </p>
                </div>
            </div>
        </main>
    )
}

function GridIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
    )
}

function PuzzleIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4.5h3.5a1.5 1.5 0 0 1 0 3H11v3H8.5a1.5 1.5 0 0 0 0 3H11v3h3v-1.5a1.5 1.5 0 0 1 3 0V16h1.5a1.5 1.5 0 0 0 0-3H17V10h1.5a1.5 1.5 0 0 0 0-3H17V5.5A1.5 1.5 0 0 0 15.5 4H9v.5Z" />
        </svg>
    )
}

function FlagIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 21V4" />
            <path d="M5 4h11l-1.5 4L16 12H5" />
        </svg>
    )
}

function PulseIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
    )
}

function MegaphoneIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z" />
            <path d="M18 9a4 4 0 0 1 0 6" />
        </svg>
    )
}

function ShieldIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5 19 6v5c0 4.2-2.8 7.7-7 9-4.2-1.3-7-4.8-7-9V6l7-2.5Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function UsersIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
            <path d="M16 5.5a3 3 0 0 1 0 5.5" />
            <path d="M17 14a5 5 0 0 1 3.5 5" />
        </svg>
    )
}

function RefreshIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
        </svg>
    )
}

export default AdminPage
