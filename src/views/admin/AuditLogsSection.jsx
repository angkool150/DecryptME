'use client'

import { useState } from 'react'
import { useDebouncedEffect, useReloadToken } from '../../lib/hooks.js'
import { apiRequest } from '../../lib/api.js'
import {
    Badge,
    EmptyState,
    ErrorBanner,
    Panel,
    SecondaryButton,
    Select,
    Spinner,
    cx,
    formatDateTime,
    inputClass,
} from './ui.jsx'

const PAGE_SIZE = 50

function actionTone(action = '') {
    if (action.includes('delete') || action.includes('unpublish')) return 'red'
    if (action.includes('create') || action.includes('publish') || action.includes('login')) return 'neon'
    if (action.includes('update') || action.includes('reorder')) return 'amber'
    return 'muted'
}

function detailsText(details) {
    if (details === null || details === undefined) return '—'
    if (typeof details === 'string') return details
    try {
        return JSON.stringify(details)
    } catch {
        return String(details)
    }
}

function AuditLogsSection() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadToken, refresh] = useReloadToken()

    const [action, setAction] = useState('')
    const [actor, setActor] = useState('')
    const [entityType, setEntityType] = useState('')

    useDebouncedEffect(
        async (signal) => {
            setLoading(true)
            setError('')
            try {
                const params = new URLSearchParams({
                    limit: String(PAGE_SIZE),
                    offset: String(page * PAGE_SIZE),
                })
                if (action.trim()) params.set('action', action.trim())
                if (actor.trim()) params.set('actor', actor.trim())
                if (entityType) params.set('entityType', entityType)

                const data = await apiRequest(`/api/admin/audit-logs?${params.toString()}`, {
                    signal,
                })
                setLogs(data.logs || [])
                setTotal(data.total || 0)
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message)
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [action, actor, entityType, page, reloadToken],
        220
    )
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}

            <Panel
                title="Audit logs"
                description="Every administrative action is recorded with the responsible actor, affected record, details, and timestamp."
                actions={<SecondaryButton onClick={refresh} disabled={loading}>Refresh</SecondaryButton>}
            >
                <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <input
                        value={action}
                        onChange={(event) => { setAction(event.target.value); setPage(0) }}
                        placeholder="Filter action (challenge, login…)"
                        className={cx(inputClass, 'h-9 max-w-[220px]')}
                    />
                    <input
                        value={actor}
                        onChange={(event) => { setActor(event.target.value); setPage(0) }}
                        placeholder="Actor username…"
                        className={cx(inputClass, 'h-9 max-w-[180px]')}
                    />
                    <Select
                        size="sm"
                        value={entityType}
                        onChange={(event) => { setEntityType(event.target.value); setPage(0) }}
                        className="w-auto min-w-[160px]"
                        containerClassName="w-auto min-w-[160px]"
                    >
                        <option value="" className="bg-[#080d0a] text-white">All records</option>
                        <option value="user" className="bg-[#080d0a] text-white">Users</option>
                        <option value="challenge" className="bg-[#080d0a] text-white">Challenges</option>
                        <option value="challenge_step" className="bg-[#080d0a] text-white">Challenge steps</option>
                        <option value="announcement" className="bg-[#080d0a] text-white">Announcements</option>
                    </Select>
                    <span className="ml-auto self-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                        {total} entries
                    </span>
                </div>

                {loading && logs.length === 0 ? (
                    <Spinner label="Loading audit trail…" />
                ) : logs.length === 0 ? (
                    <EmptyState title="No audit entries match" description="Administrative actions will be recorded here automatically." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">Actor</th>
                                    <th className="px-3 py-2.5 font-normal">Action</th>
                                    <th className="px-3 py-2.5 font-normal">Affected record</th>
                                    <th className="px-3 py-2.5 font-normal">Details</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {logs.map((entry) => {
                                    const details = detailsText(entry.details)
                                    const isLong = details.length > 80

                                    return (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-3 align-top sm:px-5">
                                                <p className="text-[11px] font-medium text-white/80">{entry.actor_username || 'system'}</p>
                                                <p className="mt-0.5 font-mono text-[8px] text-muted">actor #{entry.actor_user_id ?? '—'}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <Badge tone={actionTone(entry.action)}>{entry.action}</Badge>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-mono text-[9.5px] text-white/65">
                                                    {entry.entity_type || 'platform'}
                                                    {entry.entity_id ? ` #${entry.entity_id}` : ''}
                                                </p>
                                            </td>
                                            <td className="max-w-[340px] px-3 py-3 align-top">
                                                {isLong ? (
                                                    <details className="group">
                                                        <summary className="cursor-pointer font-mono text-[9px] text-neon/70 hover:text-neon">
                                                            View details
                                                        </summary>
                                                        <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.06] bg-black/30 p-2 text-[9px] leading-relaxed text-white/60">
                                                            {details}
                                                        </pre>
                                                    </details>
                                                ) : (
                                                    <p className="break-all font-mono text-[9px] leading-relaxed text-white/55">{details}</p>
                                                )}
                                                {entry.ip_hash ? (
                                                    <p className="mt-1 truncate font-mono text-[7.5px] text-muted/50" title={entry.ip_hash}>
                                                        ip {entry.ip_hash.slice(0, 12)}…
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-right align-top text-[10px] text-muted sm:px-5">
                                                {formatDateTime(entry.created_at)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {total === 0 ? '0 entries' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
                    </p>
                    <div className="flex items-center gap-2">
                        <SecondaryButton onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0 || loading}>
                            Previous
                        </SecondaryButton>
                        <span className="font-mono text-[9px] text-muted">Page {page + 1} / {pageCount}</span>
                        <SecondaryButton onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1 || loading}>
                            Next
                        </SecondaryButton>
                    </div>
                </div>
            </Panel>
        </div>
    )
}

export default AuditLogsSection
