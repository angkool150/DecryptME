'use client'

import { useEffect, useState } from 'react'
import { useReloadToken } from '../../lib/hooks.js'
import { apiRequest } from '../../lib/api.js'
import {
    Badge,
    EmptyState,
    ErrorBanner,
    MiniStat,
    Panel,
    SecondaryButton,
    Spinner,
    cx,
    formatDateTime,
    formatRelative,
    inputClass,
} from './ui.jsx'

function PresenceSection() {
    const [users, setUsers] = useState([])
    const [onlineCount, setOnlineCount] = useState(0)
    const [offlineCount, setOfflineCount] = useState(0)
    const [search, setSearch] = useState('')
    const [onlineOnly, setOnlineOnly] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [lastUpdated, setLastUpdated] = useState(null)
    const [error, setError] = useState('')
    const [reloadToken, refresh] = useReloadToken()

    useEffect(() => {
        let active = true
        const controller = new AbortController()

        async function load() {
            if (loading) setLoading(true)
            else setRefreshing(true)
            try {
                const params = new URLSearchParams()
                if (search.trim()) params.set('user', search.trim())
                if (onlineOnly) params.set('online', 'true')

                const data = await apiRequest(`/api/admin/presence?${params.toString()}`, {
                    signal: controller.signal,
                })
                if (!active) return
                setUsers(data.users || [])
                setOnlineCount(data.online_count || 0)
                setOfflineCount(data.offline_count || 0)
                setLastUpdated(new Date())
                setError('')
            } catch (err) {
                if (active && err.name !== 'AbortError') setError(err.message)
            } finally {
                if (active) {
                    setLoading(false)
                    setRefreshing(false)
                }
            }
        }

        const timer = setTimeout(load, 180)
        const interval = autoRefresh
            ? setInterval(() => {
                if (document.visibilityState === 'visible') load()
            }, 20000)
            : null

        return () => {
            active = false
            clearTimeout(timer)
            if (interval) clearInterval(interval)
            controller.abort()
        }
        // Loading is intentionally read once per run so polling does not restart it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, onlineOnly, autoRefresh, reloadToken])

    // refresh is provided by useReloadToken() above.

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}

            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MiniStat label="Online now" value={onlineCount} tone="text-neon" />
                <MiniStat label="Offline" value={offlineCount} tone="text-muted" />
                <MiniStat label="Visible rows" value={users.length} />
                <MiniStat label="Heartbeat window" value="90s" tone="text-neon" />
            </section>

            <Panel
                title="Online user monitoring"
                description="Presence is heartbeat-based, not tied to whether a JWT still exists. Users drop offline 90 seconds after their last activity."
                actions={
                    <>
                        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-[10.5px] text-white/70">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(event) => setAutoRefresh(event.target.checked)}
                                className="size-3.5 accent-[#73f76d]"
                            />
                            Auto-refresh
                        </label>
                        <SecondaryButton onClick={refresh} disabled={refreshing}>
                            {refreshing ? 'Refreshing…' : 'Refresh now'}
                        </SecondaryButton>
                    </>
                }
            >
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search username or email…"
                        className={cx(inputClass, 'h-9 max-w-[240px]')}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-[10.5px] text-muted">
                        <input
                            type="checkbox"
                            checked={onlineOnly}
                            onChange={(event) => setOnlineOnly(event.target.checked)}
                            className="size-3.5 accent-[#73f76d]"
                        />
                        Online only
                    </label>
                    <span className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                        Updated {lastUpdated ? formatRelative(lastUpdated.toISOString()) : '—'}
                    </span>
                </div>

                {loading ? (
                    <Spinner label="Loading presence data…" />
                ) : users.length === 0 ? (
                    <EmptyState title="No users match" description="Try clearing the search or online-only filter." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">User</th>
                                    <th className="px-3 py-2.5 font-normal">Status</th>
                                    <th className="px-3 py-2.5 font-normal">Current activity</th>
                                    <th className="px-3 py-2.5 font-normal">Last activity</th>
                                    <th className="px-3 py-2.5 font-normal">Last login</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Points</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">Solves</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {users.map((user) => (
                                    <tr key={user.id} className={user.is_online ? 'bg-neon/[0.012]' : undefined}>
                                        <td className="px-4 py-3 sm:px-5">
                                            <div className="flex items-center gap-2">
                                                <span className={cx('size-1.5 rounded-full', user.is_online ? 'bg-neon shadow-[0_0_8px_#73f76d]' : 'bg-white/20')} />
                                                <div>
                                                    <p className="text-[11.5px] font-medium text-white/85">{user.username}</p>
                                                    <p className="mt-0.5 text-[9px] text-muted">
                                                        {user.email} {user.role === 'admin' ? '· admin' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge tone={user.is_online ? 'neon' : 'muted'}>{user.is_online ? 'Online' : 'Offline'}</Badge>
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="text-[10.5px] text-white/70">{user.current_activity || (user.is_online ? 'Active' : '—')}</p>
                                            {user.current_path ? <p className="mt-0.5 font-mono text-[8px] text-muted">{user.current_path}</p> : null}
                                        </td>
                                        <td className="px-3 py-3 text-[10.5px] text-muted">
                                            {formatRelative(user.last_heartbeat_at || user.last_seen_at)}
                                        </td>
                                        <td className="px-3 py-3 text-[10.5px] text-muted">{formatDateTime(user.last_login_at)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-neon">{user.total_points}</td>
                                        <td className="px-4 py-3 text-right font-mono text-[10px] text-white/70 sm:px-5">{user.solved_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
                    <p className="text-[10px] leading-relaxed text-muted">
                        Current activity comes from the page heartbeat sent by the signed-in browser. Closing a tab leaves the last known activity visible until the 90-second window expires.
                    </p>
                </div>
            </Panel>
        </div>
    )
}

export default PresenceSection
