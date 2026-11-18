'use client'

import { useState } from 'react'
import { apiRequest, getStoredUser } from '../../lib/api.js'
import { useDebouncedEffect, useReloadToken } from '../../lib/hooks.js'
import {
    Badge,
    EmptyState,
    ErrorBanner,
    MiniStat,
    NoticeBanner,
    Panel,
    RowButton,
    SecondaryButton,
    Spinner,
    cx,
    formatDateTime,
    formatRelative,
    inputClass,
} from './ui.jsx'

function UsersSection({ onDataChanged }) {
    const currentUser = getStoredUser()
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [busyId, setBusyId] = useState(null)
    const [reloadToken, refresh] = useReloadToken()

    useDebouncedEffect(
        async (signal) => {
            setLoading(true)
            setError('')
            try {
                const params = new URLSearchParams()
                if (search.trim()) params.set('user', search.trim())
                const data = await apiRequest(`/api/admin/users?${params.toString()}`, {
                    signal,
                })
                setUsers(data.users || [])
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message)
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [search, reloadToken],
        220
    )

    async function updateUser(user, patch) {
        if (busyId) return
        setBusyId(user.id)
        setError('')
        setNotice('')
        try {
            await apiRequest(`/api/admin/users/${user.id}`, { method: 'PATCH', body: patch })
            setNotice(`Updated ${user.username}.`)
            refresh()
            onDataChanged?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusyId(null)
        }
    }

    function toggleActive(user) {
        const nextActive = !user.is_active
        if (!nextActive && !window.confirm(`Deactivate ${user.username}? They will not be able to sign in.`)) return
        updateUser(user, { is_active: nextActive })
    }

    const onlineCount = users.filter((user) => user.is_online).length
    const activeCount = users.filter((user) => user.is_active).length

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}
            <NoticeBanner message={notice} onDismiss={() => setNotice('')} />

            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MiniStat label="Student accounts" value={users.length} />
                <MiniStat label="Online" value={onlineCount} tone="text-neon" />
                <MiniStat label="Active" value={activeCount} />
                <MiniStat label="Inactive" value={users.filter((user) => !user.is_active).length} tone="text-red-300" />
            </section>

            <Panel
                title="Student accounts"
                description="Manage student access. Administrator logins are stored separately in the admins table and audited here."
                actions={<SecondaryButton onClick={refresh} disabled={loading}>Refresh</SecondaryButton>}
            >
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search username or email…"
                        className={cx(inputClass, 'h-9 max-w-[260px]')}
                    />
                    <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                        Student accounts only
                    </span>
                </div>

                {loading && users.length === 0 ? (
                    <Spinner label="Loading users…" />
                ) : users.length === 0 ? (
                    <EmptyState title="No users match" description="Try a different username or email search." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">User</th>
                                    <th className="px-3 py-2.5 font-normal">Status</th>
                                    <th className="px-3 py-2.5 font-normal">Role</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Points</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Solves</th>
                                    <th className="px-3 py-2.5 font-normal">Last activity</th>
                                    <th className="px-3 py-2.5 font-normal">Joined</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {users.map((user) => {
                                    const isSelf = Number(user.id) === Number(currentUser?.id)
                                    const busy = busyId === user.id

                                    return (
                                        <tr key={user.id} className={isSelf ? 'bg-neon/[0.012]' : undefined}>
                                            <td className="px-4 py-3 sm:px-5">
                                                <p className="text-[11.5px] font-medium text-white/85">
                                                    {user.username}
                                                    {isSelf ? <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.1em] text-neon/60">you</span> : null}
                                                </p>
                                                <p className="mt-0.5 text-[9px] text-muted">{user.email}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge tone={user.is_online ? 'neon' : 'muted'}>{user.is_online ? 'Online' : 'Offline'}</Badge>
                                                    {!user.is_active ? <Badge tone="red">Disabled</Badge> : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge tone={user.role === 'admin' ? 'amber' : 'muted'}>
                                                    {user.role === 'admin' ? 'Legacy admin role' : 'Student'}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-[10px] text-neon">{user.total_points}</td>
                                            <td className="px-3 py-3 text-right font-mono text-[10px] text-white/70">{user.solved_count}</td>
                                            <td className="px-3 py-3">
                                                <p className="text-[10.5px] text-muted">{formatRelative(user.last_heartbeat_at || user.last_seen_at)}</p>
                                                {user.current_activity ? <p className="mt-0.5 text-[9px] text-muted/70">{user.current_activity}</p> : null}
                                            </td>
                                            <td className="px-3 py-3 text-[10px] text-muted">{formatDateTime(user.created_at)}</td>
                                            <td className="px-4 py-3 text-right sm:px-5">
                                                <RowButton
                                                    onClick={() => toggleActive(user)}
                                                    disabled={isSelf || busy}
                                                    tone={user.is_active ? 'danger' : 'success'}
                                                    className="transition disabled:cursor-not-allowed disabled:opacity-35"
                                                >
                                                    {busy ? 'Saving…' : user.is_active ? 'Deactivate' : 'Activate'}
                                                </RowButton>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
                    <p className="text-[10px] leading-relaxed text-muted">
                        Deactivating an account prevents sign-in and clears its heartbeat. Existing solve history and points are preserved.
                    </p>
                </div>
            </Panel>
        </div>
    )
}

export default UsersSection
