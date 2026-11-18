'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api.js'
import { useDebouncedEffect, useReloadToken } from '../../lib/hooks.js'
import {
    Badge,
    EmptyState,
    ErrorBanner,
    MiniStat,
    Panel,
    PrimaryButton,
    RowButton,
    SecondaryButton,
    Select,
    Spinner,
    cx,
    formatDateTime,
    inputClass,
} from './ui.jsx'

const PAGE_SIZE = 25

function SubmissionsSection() {
    const [tab, setTab] = useState('history')
    const [challenges, setChallenges] = useState([])
    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState(null)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadToken, refresh] = useReloadToken()

    const [challengeId, setChallengeId] = useState('')
    const [user, setUser] = useState('')
    const [status, setStatus] = useState('all')

    useEffect(() => {
        let active = true
        apiRequest('/api/admin/challenges')
            .then((data) => {
                if (active) setChallenges(data.challenges || [])
            })
            .catch((err) => {
                if (active) setError(err.message)
            })
        return () => {
            active = false
        }
    }, [])

    useDebouncedEffect(
        async (signal) => {
            setLoading(true)
            setError('')
            try {
                const params = new URLSearchParams({
                    limit: String(PAGE_SIZE),
                    offset: String(page * PAGE_SIZE),
                })
                if (challengeId) params.set('challengeId', challengeId)
                if (user.trim()) params.set('user', user.trim())
                if (status !== 'all') params.set('status', status)

                const endpoint = tab === 'history' ? 'submissions' : 'solvers'
                const data = await apiRequest(`/api/admin/${endpoint}?${params.toString()}`, {
                    signal,
                })

                setRows(tab === 'history' ? data.submissions || [] : data.solvers || [])
                setTotal(data.total || 0)
                setSummary(data.summary || null)
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message)
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [tab, challengeId, user, status, page, reloadToken],
        220
    )
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

    function switchTab(nextTab) {
        setTab(nextTab)
        setPage(0)
    }

    function viewHistory(row) {
        setChallengeId(String(row.challenge_id))
        setUser(row.username)
        setStatus('all')
        setPage(0)
        setTab('history')
    }

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}

            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MiniStat label="Matching attempts" value={total} />
                <MiniStat label="Correct" value={summary?.correct ?? 0} tone="text-neon" />
                <MiniStat label="Incorrect" value={summary?.incorrect ?? 0} tone="text-red-300" />
                <MiniStat label="Unique users" value={summary?.users ?? 0} />
            </section>

            <Panel
                title="Challenge solvers & submission monitoring"
                description="Inspect every correct and incorrect flag attempt. Filter by challenge or operator."
                actions={
                    <>
                        <SecondaryButton onClick={refresh} disabled={loading}>Refresh</SecondaryButton>
                        <PrimaryButton onClick={() => { setChallengeId(''); setUser(''); setStatus('all'); setPage(0) }}>Clear filters</PrimaryButton>
                    </>
                }
            >
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                        <Tab active={tab === 'history'} onClick={() => switchTab('history')}>Submission history</Tab>
                        <Tab active={tab === 'solvers'} onClick={() => switchTab('solvers')}>Successful solvers</Tab>
                    </div>

                    <Select
                        size="sm"
                        value={challengeId}
                        onChange={(event) => { setChallengeId(event.target.value); setPage(0) }}
                        className="min-w-[180px] max-w-[260px]"
                        containerClassName="w-auto min-w-[180px] max-w-[260px]"
                    >
                        <option value="" className="bg-[#080d0a] text-white">All challenges</option>
                        {challenges.map((challenge) => (
                            <option key={challenge.id} value={challenge.id} className="bg-[#080d0a] text-white">
                                {challenge.title}{challenge.is_active ? '' : ' (draft)'}
                            </option>
                        ))}
                    </Select>

                    <input
                        value={user}
                        onChange={(event) => { setUser(event.target.value); setPage(0) }}
                        placeholder="Search username or email…"
                        className={cx(inputClass, 'h-9 max-w-[220px]')}
                    />

                    {tab === 'history' ? (
                        <Select
                            size="sm"
                            value={status}
                            onChange={(event) => { setStatus(event.target.value); setPage(0) }}
                            className="w-auto min-w-[140px]"
                            containerClassName="w-auto min-w-[140px]"
                        >
                            <option value="all" className="bg-[#080d0a] text-white">All statuses</option>
                            <option value="correct" className="bg-[#080d0a] text-white">Correct only</option>
                            <option value="incorrect" className="bg-[#080d0a] text-white">Failed only</option>
                        </Select>
                    ) : null}
                </div>

                {loading && rows.length === 0 ? (
                    <Spinner label="Loading submissions…" />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title="No matching submissions"
                        description={tab === 'history' ? 'Failed and correct flag attempts will appear here.' : 'No successful solves match these filters.'}
                    />
                ) : tab === 'history' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">Challenge</th>
                                    <th className="px-3 py-2.5 font-normal">User</th>
                                    <th className="px-3 py-2.5 font-normal">Submitted</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Attempt</th>
                                    <th className="px-3 py-2.5 font-normal">Status</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Points</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-3 sm:px-5">
                                            <p className="text-[11.5px] font-medium text-white/85">{row.challenge_title}</p>
                                            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{row.category}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="text-[11px] text-white/75">{row.username}</p>
                                            <p className="mt-0.5 text-[9px] text-muted">{row.email}</p>
                                        </td>
                                        <td className="px-3 py-3 text-[10.5px] text-muted">{formatDateTime(row.attempted_at)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-muted">#{row.attempt_number}</td>
                                        <td className="px-3 py-3">
                                            <Badge tone={row.is_correct ? 'neon' : 'red'}>{row.is_correct ? 'Correct' : 'Incorrect'}</Badge>
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-neon">
                                            {row.is_correct ? row.points_awarded ?? '—' : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right sm:px-5">
                                            <RowButton onClick={() => viewHistory(row)} className="transition">
                                                View
                                            </RowButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">Challenge</th>
                                    <th className="px-3 py-2.5 font-normal">Solver</th>
                                    <th className="px-3 py-2.5 font-normal">Completed</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Points</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Attempts</th>
                                    <th className="px-3 py-2.5 font-normal">Status</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-3 sm:px-5">
                                            <p className="text-[11.5px] font-medium text-white/85">{row.challenge_title}</p>
                                            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{row.category}</p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="text-[11px] text-white/75">{row.username}</p>
                                            <p className="mt-0.5 text-[9px] text-muted">{row.email}</p>
                                        </td>
                                        <td className="px-3 py-3 text-[10.5px] text-muted">{formatDateTime(row.solved_at)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-neon">{row.points_awarded}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-white/70">{row.attempts}</td>
                                        <td className="px-3 py-3"><Badge tone="neon">Correct</Badge></td>
                                        <td className="px-4 py-3 text-right sm:px-5">
                                            <RowButton onClick={() => viewHistory(row)} className="transition">
                                                History
                                            </RowButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {total === 0 ? '0 records' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
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

function Tab({ active, children, ...props }) {
    return (
        <button
            {...props}
            type="button"
            className={cx(
                'rounded-md px-3 py-1.5 text-[10.5px] font-medium transition',
                active ? 'bg-neon/[0.1] text-neon' : 'text-muted hover:text-white'
            )}
        >
            {children}
        </button>
    )
}

export default SubmissionsSection
