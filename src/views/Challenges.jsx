'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ChallengeCard from '../components/ChallengeCard.jsx'
import ChallengeModal from '../components/ChallengeModal.jsx'
import { apiRequest } from '../lib/api.js'
import { ViewError, ViewLoading } from '../components/ViewState.jsx'

function Challenges() {
    const [categories, setCategories] = useState([])
    const [search, setSearch] = useState('')
    const [difficulty, setDifficulty] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeChallenge, setActiveChallenge] = useState(null)

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase()

        return categories
            .map((category) => ({
                ...category,
                challenges: (category.challenges || []).filter((challenge) => {
                    const matchesName =
                        !term || String(challenge.name || '').toLowerCase().includes(term)
                    const matchesDifficulty =
                        difficulty === 'all' ||
                        String(challenge.difficulty || '').toLowerCase() === difficulty

                    return matchesName && matchesDifficulty
                }),
            }))
            .filter((category) => category.challenges.length > 0)
    }, [categories, search, difficulty])

    const filtersActive = search.trim() !== '' || difficulty !== 'all'
    const matchCount = filteredCategories.reduce(
        (total, category) => total + category.challenges.length,
        0,
    )

    const clearFilters = () => {
        setSearch('')
        setDifficulty('all')
    }

    const fetchChallenges = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiRequest('/api/challenges', {
                errorMessage: 'Failed to fetch challenges from database',
                includeServerError: false,
            })

            setCategories(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchChallenges()
    }, [fetchChallenges])

    const openChallenge = (challenge, category) => {
        setActiveChallenge({ ...challenge, category })
    }

    const closeChallenge = useCallback(() => setActiveChallenge(null), [])

    const handleChallengeSolved = useCallback(() => {
        fetchChallenges()
    }, [fetchChallenges])

    return (
        <main className="relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-7 sm:px-8 lg:pt-9">
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon/75">
                        Challenge archive
                    </p>
                    <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                        Challenges
                    </h1>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block">
                        <span className="sr-only">Search challenges by name</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search challenges…"
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 pr-10 text-sm text-white placeholder:text-white/40 outline-none transition hover:border-white/15 focus:border-neon/50 focus:bg-neon/[0.02] focus:ring-4 focus:ring-neon/10 sm:w-64"
                        />
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/35"
                        >
                            ⌕
                        </span>
                    </label>

                    <select
                        aria-label="Filter challenges by difficulty"
                        value={difficulty}
                        onChange={(event) => setDifficulty(event.target.value)}
                        className="h-11 rounded-xl border border-white/10 bg-[#080d0a] px-3 text-sm text-white/80 outline-none transition hover:border-white/15 focus:border-neon/50 focus:ring-4 focus:ring-neon/10"
                    >
                        <option value="all" className="bg-[#080d0a] text-white">All difficulties</option>
                        <option value="easy" className="bg-[#080d0a] text-white">Easy</option>
                        <option value="medium" className="bg-[#080d0a] text-white">Medium</option>
                        <option value="hard" className="bg-[#080d0a] text-white">Hard</option>
                        <option value="insane" className="bg-[#080d0a] text-white">Insane</option>
                    </select>

                    {filtersActive ? (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-11 rounded-xl px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:text-neon"
                        >
                            Clear
                        </button>
                    ) : null}
                </div>
            </div>

            {loading && <ViewLoading className="h-64" message="Loading challenges from database…" />}

            {error && <ViewError message={`Failed to load challenges: ${error}`} />}

            {!loading && !error && filtersActive && (
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {matchCount} {matchCount === 1 ? 'challenge' : 'challenges'} found
                </p>
            )}

            {!loading && !error && filteredCategories.length === 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-[#080d0a]/80 p-10 text-center">
                    <p className="text-sm text-white/70">No challenges match your filters.</p>
                    {filtersActive ? (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-4 rounded border border-neon/40 px-4 py-2 font-mono text-xs text-neon transition hover:bg-neon/10"
                        >
                            Clear filters
                        </button>
                    ) : null}
                </div>
            )}

            {!loading &&
                !error &&
                filteredCategories.map((category, index) => (
                    <section key={category.title}>
                        <p
                            className={`font-mono text-[30px] uppercase tracking-[0.2em] text-neon/75 ${
                                index > 0 ? 'mt-10' : ''
                            }`}
                        >
                            {category.title}
                        </p>

                        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),24rem))] justify-center gap-6">
                            {category.challenges.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challengeName={challenge.name}
                                    challengePoints={challenge.points}
                                    challengeDifficulty={challenge.difficulty}
                                    isSolved={Boolean(challenge.solved)}
                                    onClick={() =>
                                        openChallenge(challenge, category.title)
                                    }
                                />
                            ))}
                        </div>
                    </section>
                ))}

            {activeChallenge && (
                <ChallengeModal
                    challenge={activeChallenge}
                    onClose={closeChallenge}
                    onSolved={handleChallengeSolved}
                />
            )}
        </main>
    )
}

export default Challenges
