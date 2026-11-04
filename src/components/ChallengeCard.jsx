function ChallengeCard({ challengeName, challengePoints, onClick }) {
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

            {/* Card content */}
            <div className="relative z-10 flex flex-1 flex-col justify-center gap-2">
                <h3 className="font-mono text-[24px] uppercase leading-snug tracking-[0.08em] text-neon/75">
                    {challengeName}
                </h3>
                <p className="mt-2 text-lg text-white/75">
                    {challengePoints} points
                </p>
            </div>
        </button>
    )
}

export default ChallengeCard