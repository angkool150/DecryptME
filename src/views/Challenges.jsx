'use client'

import { useCallback, useEffect, useState } from 'react'
import ChallengeCard from '../components/ChallengeCard.jsx'
import ChallengeModal from '../components/ChallengeModal.jsx'
import { apiRequest } from '../lib/api.js'
import { ViewError, ViewLoading } from '../components/ViewState.jsx'

function Challenges() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeChallenge, setActiveChallenge] = useState(null)

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
            {loading && <ViewLoading className="h-64" message="Loading challenges from database…" />}

            {error && <ViewError message={`Failed to load challenges: ${error}`} />}

            {!loading &&
                !error &&
                categories.map((category, index) => (
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
