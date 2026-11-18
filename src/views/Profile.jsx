'use client'

import { useEffect, useRef, useState } from 'react'
import { apiRequest, getStoredUser, getToken, readJson, setStoredUser } from '../lib/api.js'
import { formatNumber, initials } from '../lib/format.js'
import { ViewError, ViewLoading } from '../components/ViewState.jsx'

function Profile() {
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notice, setNotice] = useState('')
    const [avatarBusy, setAvatarBusy] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [nameDraft, setNameDraft] = useState('')
    const [nameBusy, setNameBusy] = useState(false)
    const avatarInputRef = useRef(null)
    const storedUser = getStoredUser()
    const isAdminAccount = storedUser?.account === 'admin' || storedUser?.role === 'admin'

    async function fetchProfile(silent = false) {
        const currentStoredUser = getStoredUser()
        const currentIsAdmin = currentStoredUser?.account === 'admin' || currentStoredUser?.role === 'admin'

        try {
            if (!silent) setLoading(true)
            const data = await apiRequest('/api/users/me', {
                errorMessage: 'Failed to load operator profile',
                includeServerError: false,
            })
            setProfileData(data)
            setNameDraft(data?.user?.username || '')
            setError(null)
        } catch (err) {
            if (currentIsAdmin && currentStoredUser?.username) {
                setProfileData({
                    user: {
                        username: currentStoredUser.username,
                        email: currentStoredUser.email || '',
                        role: 'admin',
                        account: 'admin',
                        bio: 'DecryptMe platform administrator',
                        country: 'Global',
                        timezone: 'UTC',
                        total_points: 0,
                        solved_count: 0,
                        rank: '-',
                        created_at: null,
                    },
                    skills: [],
                    activity: [],
                    achievements: [],
                })
                setNameDraft(currentStoredUser.username)
                setError(null)
            } else {
                setError(err.message)
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    async function uploadAvatar(file) {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setNotice('Choose a PNG, JPG, GIF, or WEBP image.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setNotice('Avatar must be 5 MB or smaller.')
            return
        }

        const token = getToken()
        if (!token) {
            setNotice('You must be signed in to upload a profile picture.')
            return
        }

        setAvatarBusy(true)
        setNotice('')
        try {
            const res = await fetch(`/api/users/me/avatar?name=${encodeURIComponent(file.name || 'avatar.jpg')}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                },
                body: file,
            })
            const data = await readJson(res)
            if (!res.ok) throw new Error(data.error || 'Avatar upload failed.')
            setProfileData((current) => (current ? { ...current, user: { ...current.user, avatar_url: data.avatar_url } } : current))
            setNotice('Profile picture updated.')
        } catch (err) {
            setNotice(err.message || 'Avatar upload failed.')
        } finally {
            setAvatarBusy(false)
        }
    }

    async function saveUsername() {
        const username = String(nameDraft || '').trim()
        if (username.length < 3) {
            setNotice('Username must be at least 3 characters.')
            return
        }
        const token = getToken()
        if (!token) {
            setNotice('You must be signed in to edit your username.')
            return
        }

        setNameBusy(true)
        setNotice('')
        try {
            const data = await apiRequest('/api/users/me', {
                method: 'PATCH',
                body: { username },
                errorMessage: 'Could not update username.',
            })
            setProfileData((current) => (current ? { ...current, user: { ...current.user, username: data.user.username } } : current))
            setStoredUser({ username: data.user.username })
            setEditingName(false)
            setNotice('Username updated.')
        } catch (err) {
            setNotice(err.message || 'Could not update username.')
        } finally {
            setNameBusy(false)
        }
    }

    const user = {
        username: profileData?.user?.username || storedUser?.username || 'operator',
        email: profileData?.user?.email || storedUser?.email || '',
        role: profileData?.user?.role || storedUser?.role || 'user',
        account: profileData?.user?.account || storedUser?.account || 'user',
        bio: profileData?.user?.bio ?? (isAdminAccount ? 'DecryptMe platform administrator' : 'CTF Player'),
        avatar_url: profileData?.user?.avatar_url || null,
        country: profileData?.user?.country || 'Global',
        timezone: profileData?.user?.timezone || 'UTC',
        total_points: profileData?.user?.total_points ?? 0,
        solved_count: profileData?.user?.solved_count ?? 0,
        rank: profileData?.user?.rank ?? (isAdminAccount ? '-' : 1),
        created_at: profileData?.user?.created_at || null,
    }

    const stats = [
        { label: 'Global rank', value: `#${user.rank}`, detail: 'Live standings', icon: RankIcon },
        { label: 'Total points', value: formatNumber(user.total_points), detail: 'Verified score', icon: SparkIcon },
        { label: 'Challenges solved', value: String(user.solved_count), detail: 'Database solved count', icon: CheckIcon },
        { label: 'Clearance', value: user.role === 'admin' ? 'Admin' : 'Operator', detail: 'Account tier', icon: FlameIcon },
    ]

    const skills = profileData?.skills || []
    const activity = profileData?.activity || []
    const achievements = profileData?.achievements || []

    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently'

    const details = [
        { label: 'Handle', value: user.username },
        { label: 'Email', value: user.email || '-' },
        { label: 'Country', value: user.country || 'Global' },
        { label: 'Timezone', value: user.timezone || 'UTC' },
        { label: 'Role', value: user.role || 'user' },
        { label: 'Member since', value: memberSince },
    ]

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            {loading && <ViewLoading className="h-64" message="Loading profile from database…" />}

            {error && <ViewError message={`Failed to load profile: ${error}`} />}

            {!loading && !error && (
                <>
                    <ProfileHeader
                        user={user}
                        memberSince={memberSince}
                        avatarBusy={avatarBusy}
                        editingName={editingName}
                        nameDraft={nameDraft}
                        nameBusy={nameBusy}
                        onPickAvatar={() => avatarInputRef.current?.click()}
                        onAvatarChange={(e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) uploadAvatar(file)
                        }}
                        onEditName={() => {
                            setNameDraft(user.username)
                            setEditingName(true)
                            setNotice('')
                        }}
                        onCancelName={() => {
                            setEditingName(false)
                            setNameDraft(user.username)
                        }}
                        onNameDraft={setNameDraft}
                        onSaveName={saveUsername}
                        avatarInputRef={avatarInputRef}
                    />

                    {notice ? (
                        <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] text-white/80">
                            {notice}
                        </div>
                    ) : null}

                    <section aria-label="Operator stats" className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <StatCard key={stat.label} stat={stat} />
                        ))}
                    </section>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="flex min-w-0 flex-col gap-4">
                            <SkillBreakdown skills={skills} />
                            <RecentActivity activity={activity} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-4">
                            <OperatorDetails details={details} />
                            <Achievements achievements={achievements} />
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}

function ProfileHeader({
    user,
    memberSince,
    avatarBusy,
    editingName,
    nameDraft,
    nameBusy,
    onPickAvatar,
    onAvatarChange,
    onEditName,
    onCancelName,
    onNameDraft,
    onSaveName,
    avatarInputRef,
}) {
    const userInitials = initials(user.username || 'OP')

    return (
        <section className="relative overflow-hidden rounded-2xl border border-neon/20 bg-[#080f0b] p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(115,247,109,0.13),transparent_60%)]" />
                <div className="bg-grid absolute inset-y-0 right-0 w-56 opacity-20 [mask-image:linear-gradient(to_left,#000,transparent)]" />
                <span className="absolute -right-1 -top-12 select-none font-mono text-[130px] leading-none text-neon/[0.045]">{userInitials}</span>
            </div>

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={`${user.username} profile picture`}
                            className="size-20 rounded-2xl border border-neon/25 object-cover shadow-[inset_0_0_24px_rgba(115,247,109,0.1)]"
                        />
                    ) : (
                        <span aria-hidden="true" className="grid size-20 place-items-center rounded-2xl border border-neon/25 bg-[#0d1a11] font-mono text-2xl font-semibold text-neon shadow-[inset_0_0_24px_rgba(115,247,109,0.1)]">
                            {userInitials}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onPickAvatar}
                        disabled={avatarBusy}
                        className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-neon/30 bg-[#0d1a11] text-neon transition hover:bg-neon/10 disabled:opacity-60"
                        title="Change profile picture"
                        aria-label="Change profile picture"
                    >
                        {avatarBusy ? <span className="size-3 animate-spin rounded-full border border-neon/30 border-t-neon" /> : <CameraIcon className="size-3.5" />}
                    </button>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        onChange={onAvatarChange}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {editingName ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    value={nameDraft}
                                    onChange={(e) => onNameDraft(e.target.value.slice(0, 32))}
                                    maxLength={32}
                                    className="h-9 w-52 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[15px] font-semibold text-white outline-none focus:border-neon/40"
                                    aria-label="Username"
                                />
                                <button type="button" onClick={onSaveName} disabled={nameBusy} className="h-9 rounded-lg bg-neon px-3 text-[12px] font-semibold text-[#04120a] disabled:opacity-60">
                                    {nameBusy ? 'Saving…' : 'Save'}
                                </button>
                                <button type="button" onClick={onCancelName} disabled={nameBusy} className="h-9 rounded-lg border border-white/10 px-3 text-[12px] text-white/75 hover:bg-white/[0.04]">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">{user.username}</h1>
                                <button
                                    type="button"
                                    onClick={onEditName}
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:border-neon/25 hover:text-neon"
                                >
                                    Edit username
                                </button>
                            </>
                        )}
                        <span className="rounded-full border border-neon/25 bg-neon/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-neon">
                            {user.role === 'admin' ? 'Administrator' : 'Verified operator'}
                        </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                        Rank #{user.rank} · {formatNumber(user.total_points)} pts · Joined {memberSince}
                    </p>
                    <div className="mt-2 max-w-xl">
                        <p className="text-[12px] leading-relaxed text-muted sm:text-[13px]">
                            {user.bio || 'No bio yet.'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function StatCard({ stat }) {
    const Icon = stat.icon
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#080d0a]/80 p-3.5 backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{stat.label}</p>
                <Icon className="size-4 shrink-0 text-neon/55" />
            </div>
            <p className="mt-2.5 text-[22px] font-semibold leading-none tracking-tight text-white sm:text-[24px]">{stat.value}</p>
            <p className="mt-1.5 text-[10px] text-muted">{stat.detail}</p>
        </div>
    )
}

function SkillBreakdown({ skills }) {
    const totalSolved = skills.reduce((acc, s) => acc + s.solved, 0)
    const totalCount = skills.reduce((acc, s) => acc + s.total, 0)
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Skill breakdown</h2>
                    <p className="mt-1 text-[11px] text-muted">Solve progress by category.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {totalSolved} / {totalCount} solved
                </span>
            </div>
            <div className="mt-5 space-y-4">
                {skills.map((skill) => {
                    const percent = skill.total > 0 ? Math.round((skill.solved / skill.total) * 100) : 0
                    return (
                        <div key={skill.name}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[12px] text-white/80">{skill.name}</p>
                                <p className="shrink-0 font-mono text-[9px] text-muted">{skill.solved} / {skill.total}</p>
                            </div>
                            <div role="progressbar" aria-label={skill.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                <div className="h-full rounded-full bg-neon/80 shadow-[0_0_8px_rgba(115,247,109,0.3)]" style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function RecentActivity({ activity }) {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Recent activity</h2>
                    <p className="mt-1 text-[11px] text-muted">Your verified captures from database.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {activity.length} {activity.length === 1 ? 'capture' : 'captures'}
                </span>
            </div>
            {activity.length === 0 ? (
                <p className="mt-4 font-mono text-[11px] text-muted">No solves recorded yet.</p>
            ) : (
                <ul className="mt-3 divide-y divide-white/[0.05]">
                    {activity.map((item) => (
                        <li key={item.solve_id} className="flex items-center gap-3 py-3">
                            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] font-mono text-[8px] text-muted">
                                {item.category.slice(0, 3).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-medium text-white/85">{item.name}</p>
                                <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                    {item.category} · {new Date(item.solved_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] text-neon/85">+{item.points}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

function OperatorDetails({ details }) {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <h2 className="text-[14px] font-semibold text-white">Operator details</h2>
            <p className="mt-1 text-[11px] text-muted">Database profile information.</p>
            <dl className="mt-3">
                {details.map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-b-0 last:pb-0">
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{detail.label}</dt>
                        <dd className="text-right text-[11px] text-white/75">{detail.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

function Achievements({ achievements }) {
    const unlockedCount = achievements.filter((a) => a.unlocked).length
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Achievements</h2>
                    <p className="mt-1 text-[11px] text-muted">Milestones unlocked in database.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {unlockedCount} / {achievements.length}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {achievements.map((badge) => {
                    const isLocked = !badge.unlocked
                    return (
                        <article key={badge.id} className={`rounded-xl border p-3 ${isLocked ? 'border-white/[0.05] bg-white/[0.015]' : 'border-neon/15 bg-neon/[0.035]'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <span aria-hidden="true" className={`grid size-7 place-items-center rounded-lg border font-mono text-[8px] font-semibold ${isLocked ? 'border-white/[0.06] bg-white/[0.02] text-muted' : 'border-neon/25 bg-neon/10 text-neon'}`}>
                                    {badge.code}
                                </span>
                                <span className={`font-mono text-[7px] uppercase tracking-[0.12em] ${isLocked ? 'text-muted' : 'text-neon/70'}`}>{isLocked ? 'Locked' : 'Earned'}</span>
                            </div>
                            <h3 className={`mt-2.5 text-[11px] font-medium ${isLocked ? 'text-white/50' : 'text-white/85'}`}>{badge.name}</h3>
                            <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{badge.description}</p>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

function CameraIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h1.3l1-1.5h6.4l1 1.5h1.3A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
            <circle cx="12" cy="12" r="3.25" />
        </svg>
    )
}
function RankIcon({ className }) {
    return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></svg>)
}
function SparkIcon({ className }) {
    return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>)
}
function CheckIcon({ className }) {
    return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>)
}
function FlameIcon({ className }) {
    return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22c4 0 7-2.7 7-6.5 0-2.8-1.7-5.1-3.6-6.8-.3 1.6-1.2 2.8-2.4 3.2.2-3-1.5-5.5-4-6.9.2 3.1-1.1 5.2-2.5 7.2A8.7 8.7 0 0 0 5 15.5C5 19.3 8 22 12 22Z" /></svg>)
}

export default Profile
