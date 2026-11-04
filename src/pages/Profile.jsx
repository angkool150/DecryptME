import { useEffect } from 'react'

const STATS = [
    { label: 'Global rank', value: '#128', detail: 'up 4 this week', icon: RankIcon },
    { label: 'Total points', value: '4,820', detail: '+320 this week', icon: SparkIcon },
    { label: 'Challenges solved', value: '18', detail: '3 this week', icon: CheckIcon },
    { label: 'Current streak', value: '12 days', detail: 'personal best: 21', icon: FlameIcon },
]

const SKILLS = [
    { name: 'Forensics', solved: 3, total: 4 },
    { name: 'Cryptography', solved: 5, total: 6 },
]

const ACTIVITY = [
    { name: 'Last Light', category: 'Forensics', code: 'FOR', points: 50, time: '2h ago' },
    { name: 'Can You Read Me', category: 'Cryptography', code: 'CRY', points: 10, time: '5h ago' },
    { name: 'Zero Knowledge One Answer', category: 'Cryptography', code: 'CRY', points: 10, time: '1d ago' },
    { name: 'Too Common', category: 'Cryptography', code: 'CRY', points: 10, time: '2d ago' },
    { name: 'Cute Miming', category: 'Forensics', code: 'FOR', points: 50, time: '3d ago' },
]

const DETAILS = [
    { label: 'Handle', value: 'r3v3rs3r' },
    { label: 'Team', value: 'Independent' },
    { label: 'Location', value: 'Bangkok, TH' },
    { label: 'Timezone', value: 'UTC+07:00' },
    { label: 'Favourite category', value: 'Cryptography' },
    { label: 'Member since', value: 'Oct 12, 2023' },
]

const BADGES = [
    { code: 'FF', name: 'First flag', detail: 'Solved the first challenge' },
    { code: '7D', name: 'Week streak', detail: 'Active for 7 days' },
    { code: 'CR', name: 'Crypto mind', detail: 'Solved 5 crypto targets' },
    { code: 'FO', name: 'Forensic eye', detail: 'Solved 3 stego targets' },
    { code: 'T100', name: 'Top 100', detail: '28 ranks to climb', locked: true },
    { code: 'SP', name: 'Speedrun', detail: 'Solve in under 5 minutes', locked: true },
]

function Profile() {
    useEffect(() => {
        document.title = 'Profile · decryptme'
    }, [])

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            <ProfileHeader />

            <section
                aria-label="Operator stats"
                className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
            >
                {STATS.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                ))}
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-4">
                    <SkillBreakdown />
                    <RecentActivity />
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                    <OperatorDetails />
                    <Achievements />
                </div>
            </div>
        </main>
    )
}

function ProfileHeader() {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-neon/20 bg-[#080f0b] p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(115,247,109,0.13),transparent_60%)]" />
                <div className="bg-grid absolute inset-y-0 right-0 w-56 opacity-20 [mask-image:linear-gradient(to_left,#000,transparent)]" />
                <span className="absolute -right-1 -top-12 select-none font-mono text-[130px] leading-none text-neon/[0.045]">
                    RK
                </span>
            </div>

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                    <span
                        aria-hidden="true"
                        className="grid size-20 place-items-center rounded-2xl border border-neon/25 bg-[#0d1a11] font-mono text-2xl font-semibold text-neon shadow-[inset_0_0_24px_rgba(115,247,109,0.1)]"
                    >
                        RK
                    </span>
                    <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-[#080f0b] bg-neon" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                            r3v3rs3r
                        </h1>
                        <span className="rounded-full border border-neon/25 bg-neon/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-neon">
                            Verified operator
                        </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                        Rank #128 · 4,820 pts · Joined Oct 2023
                    </p>
                    <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted sm:text-[13px]">
                        Reverse engineer and CTF generalist. I like packed binaries, unusual file
                        formats, and the moment a hidden string finally makes sense.
                    </p>
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

function SkillBreakdown() {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Skill breakdown</h2>
                    <p className="mt-1 text-[11px] text-muted">Solve progress by category.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    8 / 10 solved
                </span>
            </div>

            <div className="mt-5 space-y-4">
                {SKILLS.map((skill) => {
                    const percent = Math.round((skill.solved / skill.total) * 100)

                    return (
                        <div key={skill.name}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[12px] text-white/80">{skill.name}</p>
                                <p className="shrink-0 font-mono text-[9px] text-muted">
                                    {skill.solved} / {skill.total}
                                </p>
                            </div>
                            <div
                                role="progressbar"
                                aria-label={skill.name}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={percent}
                                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                            >
                                <div
                                    className="h-full rounded-full bg-neon/80 shadow-[0_0_8px_rgba(115,247,109,0.3)]"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function RecentActivity() {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Recent activity</h2>
                    <p className="mt-1 text-[11px] text-muted">Your latest captures.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    Last 7 days
                </span>
            </div>

            <ul className="mt-3 divide-y divide-white/[0.05]">
                {ACTIVITY.map((item) => (
                    <li key={`${item.name}-${item.time}`} className="flex items-center gap-3 py-3">
                        <span
                            aria-hidden="true"
                            className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] font-mono text-[8px] text-muted"
                        >
                            {item.code}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-white/85">{item.name}</p>
                            <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                {item.category} · {item.time}
                            </p>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-neon/85">
                            +{item.points}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function OperatorDetails() {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <h2 className="text-[14px] font-semibold text-white">Operator details</h2>
            <p className="mt-1 text-[11px] text-muted">Public profile information.</p>

            <dl className="mt-3">
                {DETAILS.map((detail) => (
                    <div
                        key={detail.label}
                        className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-b-0 last:pb-0"
                    >
                        <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                            {detail.label}
                        </dt>
                        <dd className="text-right text-[11px] text-white/75">{detail.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

function Achievements() {
    return (
        <section className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-[14px] font-semibold text-white">Achievements</h2>
                    <p className="mt-1 text-[11px] text-muted">Milestones unlocked so far.</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    4 / 6
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                {BADGES.map((badge) => (
                    <article
                        key={badge.code}
                        className={`rounded-xl border p-3 ${badge.locked
                            ? 'border-white/[0.05] bg-white/[0.015]'
                            : 'border-neon/15 bg-neon/[0.035]'
                            }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span
                                aria-hidden="true"
                                className={`grid size-7 place-items-center rounded-lg border font-mono text-[8px] font-semibold ${badge.locked
                                    ? 'border-white/[0.06] bg-white/[0.02] text-muted'
                                    : 'border-neon/25 bg-neon/10 text-neon'
                                    }`}
                            >
                                {badge.code}
                            </span>
                            <span
                                className={`font-mono text-[7px] uppercase tracking-[0.12em] ${badge.locked ? 'text-muted' : 'text-neon/70'
                                    }`}
                            >
                                {badge.locked ? 'Locked' : 'Earned'}
                            </span>
                        </div>
                        <h3 className={`mt-2.5 text-[11px] font-medium ${badge.locked ? 'text-white/50' : 'text-white/85'}`}>
                            {badge.name}
                        </h3>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{badge.detail}</p>
                    </article>
                ))}
            </div>
        </section>
    )
}

function RankIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" />
        </svg>
    )
}

function SparkIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
            <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
        </svg>
    )
}

function CheckIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

function FlameIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22c4 0 7-2.7 7-6.5 0-2.8-1.7-5.1-3.6-6.8-.3 1.6-1.2 2.8-2.4 3.2.2-3-1.5-5.5-4-6.9.2 3.1-1.1 5.2-2.5 7.2A8.7 8.7 0 0 0 5 15.5C5 19.3 8 22 12 22Z" />
        </svg>
    )
}

export default Profile
