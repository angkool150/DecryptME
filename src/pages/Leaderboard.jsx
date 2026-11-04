import { useEffect } from 'react'

const TOP_PLAYERS = [
    { rank: 1, name: 'n0cturne', initials: 'N0', points: 7420, solved: 86, weekly: 180 },
    { rank: 2, name: 'hexwitch', initials: 'HX', points: 6980, solved: 79, weekly: 95 },
    { rank: 3, name: 'dr0id', initials: 'DR', points: 6540, solved: 72, weekly: 140 },
]

const RANKINGS = [
    ...TOP_PLAYERS,
    { rank: 4, name: 'cipherpunk', initials: 'CP', points: 5890, solved: 64, weekly: 75 },
    { rank: 5, name: 'v0idwalk3r', initials: 'V0', points: 5420, solved: 58, weekly: 60 },
    { rank: 6, name: 'rootghost', initials: 'RG', points: 4980, solved: 52, weekly: 45 },
    { rank: 7, name: 'shellspecter', initials: 'SS', points: 4930, solved: 51, weekly: 30 },
    { rank: 8, name: 'glitchprophet', initials: 'GP', points: 4895, solved: 50, weekly: 85 },
    { rank: 9, name: 'bytemaiden', initials: 'BM', points: 4870, solved: 49, weekly: 25 },
    { rank: 10, name: 'nullpointer', initials: 'NP', points: 4840, solved: 48, weekly: 40 },
]

const YOU = {
    rank: 128,
    name: 'r3v3rs3r',
    initials: 'RK',
    points: 4820,
    solved: 18,
    weekly: 320,
}

function Leaderboard() {
    useEffect(() => {
        document.title = 'Leaderboard · decryptme'
    }, [])

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon/75">
                        Global standings
                    </p>
                    <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                        Leaderboard
                    </h1>
                    <p className="mt-1.5 max-w-xl text-[12px] text-muted sm:text-[13px]">
                        Operators ranked by total points earned across every DecryptMe challenge.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
                    <span aria-hidden="true" className="animate-pulse-dot size-1.5 rounded-full bg-neon" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/70">
                        Live standings
                    </span>
                    <span aria-hidden="true" className="h-3 w-px bg-white/10" />
                    <span className="font-mono text-[9px] text-muted">12,480 operators</span>
                </div>
            </div>

            <section aria-label="Top three operators" className="mt-6 grid gap-3 sm:grid-cols-3">
                <h2 className="sr-only">Top operators</h2>
                {TOP_PLAYERS.map((player) => (
                    <PodiumCard key={player.rank} player={player} />
                ))}
            </section>

            <section
                aria-labelledby="rankings-heading"
                className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 backdrop-blur-sm"
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
                    <div>
                        <h2 id="rankings-heading" className="text-[14px] font-semibold text-white">
                            Global rankings
                        </h2>
                        <p className="mt-1 text-[11px] text-muted">
                            Points are updated every few minutes.
                        </p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                        All time
                    </span>
                </div>

                <ol aria-label="Operator rankings">
                    {RANKINGS.map((player) => (
                        <RankRow key={player.rank} player={player} />
                    ))}
                    <RankRow player={YOU} isYou />
                </ol>
            </section>
        </main>
    )
}

function PodiumCard({ player }) {
    const isLeader = player.rank === 1

    return (
        <article
            className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm sm:p-5 ${isLeader
                ? 'border-neon/30 bg-neon/[0.045] shadow-[0_0_50px_-20px_rgba(115,247,109,0.35)]'
                : 'border-white/[0.07] bg-[#080d0a]/80'
                }`}
        >
            {isLeader ? (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(115,247,109,0.12),transparent_60%)]"
                />
            ) : null}

            <div className="relative flex items-center justify-between gap-3">
                <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${isLeader ? 'text-neon' : 'text-muted'}`}>
                    Rank {String(player.rank).padStart(2, '0')}
                </span>
                {isLeader ? (
                    <span className="rounded-full border border-neon/25 bg-neon/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-neon">
                        Leader
                    </span>
                ) : null}
            </div>

            <div className="relative mt-4 flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border font-mono text-[10px] font-semibold ${isLeader
                        ? 'border-neon/30 bg-neon/10 text-neon'
                        : 'border-white/[0.08] bg-white/[0.03] text-white/75'
                        }`}
                >
                    {player.initials}
                </span>
                <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-medium text-white">{player.name}</h3>
                    <p className="mt-0.5 font-mono text-[9px] text-muted">
                        {player.solved} challenges solved
                    </p>
                </div>
            </div>

            <div className="relative mt-5 flex items-end justify-between gap-3">
                <p className="text-[22px] font-semibold leading-none tracking-tight text-white">
                    {player.points.toLocaleString()}
                    <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                        pts
                    </span>
                </p>
                <span className="font-mono text-[9px] text-neon/80">+{player.weekly} this week</span>
            </div>
        </article>
    )
}

function RankRow({ player, isYou = false }) {
    return (
        <li
            aria-label={isYou ? 'Your position' : undefined}
            className={`flex items-center gap-3 px-3 py-3 sm:px-5 ${isYou
                ? 'border-t border-neon/20 bg-neon/[0.045]'
                : 'border-t border-white/[0.05] first:border-t-0'
                }`}
        >
            <span
                className={`w-7 shrink-0 font-mono text-[10px] ${player.rank <= 3 ? 'text-neon' : 'text-muted'} ${isYou ? 'text-neon' : ''
                    }`}
            >
                {player.rank}
            </span>

            <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-[9px] font-semibold ${isYou
                    ? 'border-neon/25 bg-neon/10 text-neon'
                    : 'border-white/[0.07] bg-white/[0.025] text-white/65'
                    }`}
            >
                {player.initials}
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-medium text-white">{player.name}</p>
                    {isYou ? (
                        <span className="rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-neon">
                            You
                        </span>
                    ) : null}
                </div>
                <p className="mt-0.5 truncate font-mono text-[9px] text-muted">
                    {player.solved} solved
                    <span aria-hidden="true"> · </span>
                    <span className="text-neon/75">+{player.weekly} this week</span>
                </p>
            </div>

            <div className="shrink-0 text-right">
                <p className={`font-mono text-[12px] ${isYou ? 'text-neon' : 'text-white/85'}`}>
                    {player.points.toLocaleString()}
                </p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    points
                </p>
            </div>
        </li>
    )
}

export default Leaderboard
