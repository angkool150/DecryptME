'use client'

const DIFFICULTY_STYLES = {
    easy: 'border-neon/30 bg-neon/[0.08] text-neon',
    medium: 'border-amber-400/30 bg-amber-400/[0.08] text-amber-300',
    hard: 'border-orange-400/30 bg-orange-400/[0.08] text-orange-300',
    insane: 'border-red-400/30 bg-red-400/[0.08] text-red-300',
}

function ChallengeCard({
    challengeName,
    challengePoints,
    challengeDifficulty = '',
    isSolved = false,
    onClick,
}) {
    const difficulty = String(challengeDifficulty || '').trim().toLowerCase()
    const difficultyClass = DIFFICULTY_STYLES[difficulty] || 'border-white/10 bg-white/[0.04] text-white/60'

    return (
        <button
            type="button"
            onClick={onClick}
            aria-haspopup="dialog"
            className="relative flex min-h-44 w-full max-w-sm cursor-pointer flex-col overflow-hidden rounded-2xl border border-neon/20 bg-[#080f0b] p-5 text-left transition-colors hover:border-neon/30 sm:p-6"
        >
            {/* Background decorations */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,rgba(115,247,109,0.13),transparent_60%)]" />
                <div className="bg-grid absolute inset-y-0 right-0 w-56 opacity-20 [mask-image:linear-gradient(to_left,#000,transparent)]" />
                <span className="absolute -right-2 -top-10 select-none font-mono text-[130px] leading-none text-neon/[0.045]">
                    &gt;_
                </span>
            </div>

            {/* Solved badge */}
            {Boolean(isSolved) && (
                <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neon">
                    <span>✓</span> Solved
                </div>
            )}

            {/* Card content */}
            <div className="relative z-10 flex flex-1 flex-col justify-center gap-2">
                {difficulty ? (
                    <span
                        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${difficultyClass}`}
                    >
                        {difficulty}
                    </span>
                ) : null}
                <h3 className={`font-mono text-[24px] uppercase leading-snug tracking-[0.08em] text-neon/75 ${isSolved ? 'pr-20' : ''}`}>
                    {challengeName}
                </h3>
                <p className="mt-1 text-lg text-white/75">
                    {challengePoints} points
                </p>
            </div>
        </button>
    )
}

export default ChallengeCard