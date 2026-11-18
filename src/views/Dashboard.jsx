'use client'

import { useEffect, useState } from 'react'
import { navigate } from '../navigation.js'
import { apiRequest, getStoredUser } from '../lib/api.js'
import { formatNumber, initials } from '../lib/format.js'
import { ViewError, ViewLoading } from '../components/ViewState.jsx'

function Dashboard() {
    const [data, setData] = useState(null)
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchDashboard() {
            try {
                setLoading(true)
                const announcementsPromise = apiRequest('/api/announcements').catch(() => null)

                const resData = await apiRequest('/api/users/dashboard', {
                    errorMessage: 'Failed to load dashboard data',
                    includeServerError: false,
                })
                setData(resData)

                const announcementData = await announcementsPromise
                if (announcementData) {
                    setAnnouncements(announcementData.announcements || [])
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    const storedUser = getStoredUser()
    const isAdminAccount = storedUser?.account === 'admin' || storedUser?.role === 'admin'

    const user = {
        ...(data?.user || {}),
        username: storedUser?.username || data?.user?.username || 'operator',
        total_points: data?.user?.total_points ?? 0,
        solved_count: data?.user?.solved_count ?? 0,
        rank: data?.user?.rank ?? 1,
        nextRankPosition: data?.user?.nextRankPosition,
        nextRankPoints: data?.user?.nextRankPoints,
    }

    const stats = isAdminAccount
        ? [
            { label: 'Role', value: 'Admin', detail: 'Platform administrator', icon: TrophyIcon },
            { label: 'Console', value: 'Ready', detail: 'Manage challenges & users', icon: SparkIcon },
            { label: 'Access', value: 'Full', detail: 'Administrative controls', icon: CheckIcon },
            { label: 'Status', value: 'Active', detail: 'Administrator verified', icon: FlameIcon },
        ]
        : [
            { label: 'Current rank', value: `#${user.rank}`, detail: 'Global standings', icon: TrophyIcon },
            { label: 'Total points', value: formatNumber(user.total_points), detail: 'Accumulated score', icon: SparkIcon },
            { label: 'Challenges solved', value: String(user.solved_count), detail: 'Verified captures', icon: CheckIcon },
            { label: 'Status', value: 'Active', detail: 'Operator verified', icon: FlameIcon },
        ]

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon/75">
                        Operator dashboard
                    </p>
                    <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                        Welcome back, {user.username}.
                    </h1>
                    <p className="mt-1.5 text-[12px] text-muted sm:text-[13px]">
                        Pick up an unfinished challenge or take on today&apos;s target.
                    </p>
                </div>

                <a
                    href="/challenges"
                    onClick={(event) => {
                        event.preventDefault()
                        navigate('/challenges')
                    }}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-neon px-4 text-[12px] font-semibold text-[#04120a] shadow-[0_0_28px_-6px_rgba(115,247,109,0.6)] transition hover:bg-neon-bright active:scale-[0.99]"
                >
                    Browse challenges
                    <ArrowUpRightIcon className="size-3.5" />
                </a>
            </div>

            {loading && <ViewLoading className="mt-12 h-32" message="Loading operator intel from database…" />}

            {error && <ViewError className="mt-6" message={`Failed to connect to database: ${error}`} />}

            {!loading && !error && (
                <>
                    <section
                        aria-label="Your stats"
                        className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
                    >
                        {stats.map((stat) => (
                            <StatCard key={stat.label} stat={stat} />
                        ))}
                    </section>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
                        <LastChallenge featured={data?.featured} />
                        <LeaderboardSection leaderboard={data?.leaderboard || []} user={user} />
                    </div>

                    <AnnouncementsPanel announcements={announcements} />
                </>
            )}
        </main>
    )
}

function AnnouncementsPanel({ announcements }) {
    return (
        <section
            id="announcements"
            className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d0a]/85 backdrop-blur-sm"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2">
                    <MegaphoneIcon className="size-4 text-neon/70" />
                    <h2 className="text-[13px] font-semibold text-white">Announcements</h2>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {announcements.length} published
                </span>
            </div>

            {announcements.length === 0 ? (
                <p className="px-4 py-5 text-[11.5px] text-muted sm:px-5">
                    No announcements have been published yet. Check back soon.
                </p>
            ) : (
                <div className="divide-y divide-white/[0.05]">
                    {announcements.map((announcement) => (
                        <article key={announcement.id} className="px-4 py-4 sm:px-5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h3 className="text-[12.5px] font-semibold text-white/90">{announcement.title}</h3>
                                <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                    {announcement.published_at
                                        ? new Date(announcement.published_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : ''}
                                </span>
                            </div>
                            <p className="mt-1.5 max-w-4xl whitespace-pre-line text-[11.5px] leading-relaxed text-white/65">
                                {announcement.body}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

function StatCard({ stat }) {
    const Icon = stat.icon

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#080d0a]/80 p-3.5 backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {stat.label}
                </p>
                <Icon className="size-4 shrink-0 text-neon/55" />
            </div>
            <p className="mt-2.5 text-[22px] font-semibold leading-none tracking-tight text-white sm:text-[24px]">
                {stat.value}
            </p>
            <p className="mt-1.5 text-[10px] text-muted">{stat.detail}</p>
        </div>
    )
}

function LastChallenge({ featured }) {
    const title = featured ? featured.title : 'No active target'
    const category = featured ? featured.category : 'General'
    const points = featured ? `${featured.points} pts` : '-'
    const attempts = featured ? String(featured.total_attempts || 0) : '0'

    return (
        <section
            id="last-challenge"
            className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neon/20 bg-[#080f0b] p-5 sm:p-6"
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(115,247,109,0.13),transparent_60%)]" />
                <div className="bg-grid absolute inset-y-0 right-0 w-56 opacity-20 [mask-image:linear-gradient(to_left,#000,transparent)]" />
                <span className="absolute -right-2 -top-10 select-none font-mono text-[130px] leading-none text-neon/[0.045]">
                    &gt;_
                </span>
            </div>

            <div className="relative flex flex-1 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/25 bg-neon/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-neon">
                        <span className="size-1 rounded-full bg-neon" />
                        Featured Challenge
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                        Active Database Target
                    </span>
                </div>

                <div className="mt-6 max-w-lg">
                    <h2 className="text-[22px] font-semibold uppercase tracking-[-0.02em] text-white sm:text-[26px]">
                        {title}
                    </h2>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[13px] uppercase tracking-[0.08em] text-neon/80">
                        {category}
                    </span>
                </div>

                <dl className="mt-6 grid max-w-lg grid-cols-1 gap-x-6 gap-y-2 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                    <IntelRow label="Reward" value={points} accent />
                    <IntelRow label="Attempts" value={attempts} />
                    <IntelRow label="Attachment" value={featured?.attachment_url ? 'Available' : 'None'} />
                    <IntelRow label="Flag format" value="flag{...}" />
                </dl>

                <div className="mt-auto flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                        Solve to advance in global standings.
                    </p>
                    <a
                        href="/challenges"
                        onClick={(e) => {
                            e.preventDefault()
                            navigate('/challenges')
                        }}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-neon px-4 text-[11px] font-semibold text-[#04120a] shadow-[0_0_24px_-4px_rgba(115,247,109,0.55)] transition hover:bg-neon-bright active:scale-[0.99] sm:self-auto"
                    >
                        View Challenge
                        <ArrowUpRightIcon className="size-3.5" />
                    </a>
                </div>
            </div>
        </section>
    )
}

function IntelRow({ label, value, accent = false }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-1.5">
            <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                {label}
            </dt>
            <dd className={`font-mono text-[10px] ${accent ? 'text-neon' : 'text-white/75'}`}>
                {value}
            </dd>
        </div>
    )
}

function LeaderboardSection({ leaderboard, user }) {
    return (
        <aside
            id="leaderboard"
            className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d0a]/85 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="size-4 text-neon/70" />
                    <h2 className="text-[13px] font-semibold text-white">Leaderboard</h2>
                </div>
                <a
                    href="/leaderboard"
                    onClick={(e) => {
                        e.preventDefault()
                        navigate('/leaderboard')
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition hover:text-neon"
                >
                    View all
                </a>
            </div>

            <ol aria-label="Top players" className="flex flex-1 flex-col justify-center px-2 py-1.5">
                {leaderboard.map((player, index) => (
                    <li
                        key={player.username}
                        className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.03]"
                    >
                        <span
                            className={`w-4 text-center font-mono text-[10px] ${
                                index < 3 ? 'text-neon/80' : 'text-muted/60'
                            }`}
                        >
                            {player.rank_position}
                        </span>
                        <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[9px] text-white/65">
                            {player.avatar_url ? (
                                <AvatarImage
                                    src={player.avatar_url}
                                    alt={`${player.username} profile picture`}
                                    className="size-full rounded-full object-cover"
                                    fallback={initials(player.username)}
                                />
                            ) : (
                                initials(player.username)
                            )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-white/80">
                            {player.username}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                            {formatNumber(Number(player.points), 'en-US')}
                        </span>
                    </li>
                ))}
            </ol>

            <div className="border-t border-white/[0.06] p-2">
                <div className="rounded-xl border border-neon/20 bg-neon/[0.05] px-2.5 py-2.5">
                    <div className="flex items-center gap-3">
                        <span className="w-4 text-center font-mono text-[10px] text-neon">
                            {user.rank}
                        </span>
                        <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border border-neon/25 bg-neon/[0.08] font-mono text-[9px] text-neon">
                            {user.avatar_url ? (
                                <AvatarImage
                                    src={user.avatar_url}
                                    alt={`${user.username} profile picture`}
                                    className="size-full rounded-full object-cover"
                                    fallback={initials(user.username)}
                                />
                            ) : (
                                initials(user.username)
                            )}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-[12px] font-medium text-white">
                                {user.username}
                                <span className="rounded border border-neon/25 bg-neon/10 px-1 py-px font-mono text-[8px] uppercase tracking-[0.12em] text-neon">
                                    You
                                </span>
                            </p>
                            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                                Your position
                            </p>
                        </div>
                        <span className="font-mono text-[10px] text-neon">
                            {formatNumber(user.total_points)}
                        </span>
                    </div>

                    {user.nextRankPosition && (
                        <div className="mt-2.5">
                            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                                <span>Next: #{user.nextRankPosition}</span>
                                <span>{user.nextRankPoints} pts to go</span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                                <div className="h-full w-[80%] rounded-full bg-neon/80" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}

function MegaphoneIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z" />
            <path d="M18 9a4 4 0 0 1 0 6" />
        </svg>
    )
}

function TrophyIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
            <path d="M7 6H4v1a4 4 0 0 0 4 4" />
            <path d="M17 6h3v1a4 4 0 0 1-4 4" />
        </svg>
    )
}

function SparkIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
        </svg>
    )
}

function CheckIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
    )
}

function FlameIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5.2-4.1-7.1C13.8 7.3 12.8 5.3 13 2c-2.4 2.2-4 4.4-4 7 0 1.4.5 2.6 1.2 3.5-.8-.2-1.7-.8-2.2-1.6-.8 1.2-1.3 2.7-1.3 4.2C6.7 19.2 9.7 22 12 22Z" />
        </svg>
    )
}

function ArrowUpRightIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
        </svg>
    )
}

function AvatarImage({ src, alt, className, fallback }) {
    const [failed, setFailed] = useState(false)
    if (failed) return fallback
    return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />
}

export default Dashboard
