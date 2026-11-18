'use client'

import { formatDateTime, formatRelative, Panel, StatCard, Badge, EmptyState, SecondaryButton } from './ui.jsx'

function OverviewSection({ overview, onNavigate, refreshing }) {
    const stats = overview?.stats || {}
    const recentSolves = overview?.recent_solves || []
    const recentAudit = overview?.recent_audit || []
    const topChallenges = overview?.top_challenges || []

    return (
        <div className="space-y-4">
            <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
                <StatCard label="Online now" value={stats.online_now ?? 0} detail="Heartbeat within 90 seconds" />
                <StatCard label="Registered users" value={stats.users_total ?? 0} detail={`${stats.users_active ?? 0} active accounts`} />
                <StatCard label="Active challenges" value={stats.challenges_active ?? 0} detail={`${stats.challenges_total ?? 0} total, including drafts`} />
                <StatCard label="Flag attempts" value={stats.attempts_total ?? 0} detail={`${stats.solves_total ?? 0} successful solves`} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <Panel
                    title="Recent solves"
                    description={refreshing ? 'Refreshing platform data…' : 'Latest successful flag captures across all challenges.'}
                    actions={<SecondaryButton onClick={() => onNavigate('submissions')}>Open submissions</SecondaryButton>}
                >
                    {recentSolves.length === 0 ? (
                        <EmptyState title="No solves yet" description="Successful flag submissions will appear here." />
                    ) : (
                        <ul className="divide-y divide-white/[0.05]">
                            {recentSolves.map((solve) => (
                                <li key={solve.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-neon/15 bg-neon/[0.05] font-mono text-[9px] text-neon">
                                        +{solve.points_awarded}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-medium text-white/85">{solve.challenge_title}</p>
                                        <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                            {solve.username} · {solve.category}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-mono text-[9px] text-muted">{formatRelative(solve.solved_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Quick actions" description="Jump to the most-used management tools.">
                    <div className="grid gap-2 p-4">
                        <QuickAction label="Create a challenge" hint="Add a new Forensics or Cryptography problem" onClick={() => onNavigate('challenges')} />
                        <QuickAction label="Review submissions" hint="Inspect correct and failed attempts" onClick={() => onNavigate('submissions')} />
                        <QuickAction label="Publish an announcement" hint={`${stats.announcements_published ?? 0} currently published`} onClick={() => onNavigate('announcements')} />
                        <QuickAction label="Check online users" hint="See heartbeat and current activity" onClick={() => onNavigate('presence')} />
                    </div>
                </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <Panel title="Most attempted challenges" description="Active problems ranked by solves and attempts.">
                    {topChallenges.length === 0 ? (
                        <EmptyState title="No active challenges" />
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {topChallenges.map((challenge) => (
                                <div key={challenge.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-medium text-white/85">{challenge.title}</p>
                                        <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">{challenge.category}</p>
                                    </div>
                                    <Badge tone="neon">{challenge.solves} solved</Badge>
                                    <span className="w-20 text-right font-mono text-[9px] text-muted">{challenge.attempts} tries</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                <Panel title="Recent admin activity" description="Latest entries from the audit trail.">
                    {recentAudit.length === 0 ? (
                        <EmptyState title="No audit entries" description="Challenge, module, announcement, and user changes are recorded here." />
                    ) : (
                        <ul className="divide-y divide-white/[0.05]">
                            {recentAudit.map((entry) => (
                                <li key={entry.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-mono text-[10px] text-white/80">{entry.action}</p>
                                        <p className="mt-0.5 text-[10px] text-muted">{entry.actor_username || 'system'}</p>
                                    </div>
                                    <span className="shrink-0 font-mono text-[9px] text-muted">{formatDateTime(entry.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>
        </div>
    )
}

function QuickAction({ label, hint, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] px-3 py-2.5 text-left transition hover:border-neon/20 hover:bg-neon/[0.035]"
        >
            <span>
                <span className="block text-[12px] font-medium text-white/85">{label}</span>
                <span className="mt-0.5 block text-[10px] text-muted">{hint}</span>
            </span>
            <span aria-hidden="true" className="text-neon/70">→</span>
        </button>
    )
}

export default OverviewSection
