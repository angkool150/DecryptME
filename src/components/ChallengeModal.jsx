import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { isCorrectTestFlag } from '../data/testFlags.js'

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const URL_PATTERN = /(https?:\/\/[^\s]+)/g

const WIN_KEYFRAMES = [
    { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(115, 247, 109, 0)' },
    {
        transform: 'scale(1.018)',
        boxShadow: '0 0 55px 10px rgba(115, 247, 109, 0.32)',
        offset: 0.35,
    },
    {
        transform: 'scale(0.997)',
        boxShadow: '0 0 26px 4px rgba(115, 247, 109, 0.16)',
        offset: 0.7,
    },
    { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(115, 247, 109, 0)' },
]

const LOSE_KEYFRAMES = [
    { transform: 'translateX(0)', boxShadow: '0 0 0 0 rgba(248, 113, 113, 0)' },
    {
        transform: 'translateX(-9px)',
        boxShadow: '0 0 0 3px rgba(248, 113, 113, 0.22)',
        offset: 0.15,
    },
    { transform: 'translateX(8px)', offset: 0.32 },
    { transform: 'translateX(-6px)', offset: 0.49 },
    { transform: 'translateX(4px)', offset: 0.66 },
    { transform: 'translateX(-2px)', offset: 0.83 },
    { transform: 'translateX(0)', boxShadow: '0 0 0 0 rgba(248, 113, 113, 0)' },
]

const CONFETTI_COLORS = ['#73f76d', '#b7ffb0', '#4ade80', '#facc15', '#e5ffde', '#22d3ee']

function createConfettiPieces() {
    const spread = Math.min(window.innerWidth * 0.42, 520)
    const lift = Math.min(window.innerHeight * 0.25, 260)
    const drop = window.innerHeight * 0.32

    return Array.from({ length: 72 }, (_, index) => {
        const angle = Math.random() * Math.PI * 2 - Math.PI / 2
        const distance = 0.35 + Math.random() * 0.65

        return {
            id: index,
            tx: Math.round(Math.cos(angle) * spread * distance),
            ty: Math.round(Math.sin(angle) * lift * distance + drop),
            spin: Math.round((Math.random() - 0.5) * 1080),
            delay: Math.round(Math.random() * 120),
            duration: Math.round(950 + Math.random() * 650),
            width: Math.round(5 + Math.random() * 5),
            height: Math.round(8 + Math.random() * 8),
            radius: Math.random() > 0.75 ? '50%' : '2px',
            color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        }
    })
}

function ConfettiBurst() {
    const pieces = useMemo(() => createConfettiPieces(), [])

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
        >
            {pieces.map((piece) => (
                <span
                    key={piece.id}
                    className="confetti-piece"
                    style={{
                        '--tx': `${piece.tx}px`,
                        '--ty': `${piece.ty}px`,
                        '--spin': `${piece.spin}deg`,
                        '--duration': `${piece.duration}ms`,
                        '--delay': `${piece.delay}ms`,
                        width: `${piece.width}px`,
                        height: `${piece.height}px`,
                        borderRadius: piece.radius,
                        backgroundColor: piece.color,
                    }}
                />
            ))}
        </div>
    )
}

function playWinSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    try {
        const context = new AudioContextClass()
        const now = context.currentTime
        const notes = [523.25, 659.25, 783.99, 1046.5]

        context.resume?.()

        notes.forEach((frequency, index) => {
            const start = now + index * 0.075
            const oscillator = context.createOscillator()
            const gain = context.createGain()

            oscillator.type = 'triangle'
            oscillator.frequency.setValueAtTime(frequency, start)
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
            oscillator.connect(gain)
            gain.connect(context.destination)
            oscillator.start(start)
            oscillator.stop(start + 0.5)
        })

        window.setTimeout(() => {
            context.close().catch(() => {})
        }, 1400)
    } catch {
        // Audio is optional; ignore browsers that block it.
    }
}

function renderStepText(text) {
    return text.split(URL_PATTERN).map((part, index) => {
        if (!/^https?:\/\//.test(part)) return part

        return (
            <a
                key={`${part}-${index}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-neon underline decoration-neon/40 underline-offset-2 transition hover:decoration-neon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
            >
                {part}
            </a>
        )
    })
}

function ChallengeModal({ challenge, onClose }) {
    const dialogRef = useRef(null)
    const closeButtonRef = useRef(null)
    const previouslyFocusedRef = useRef(null)
    const activeChallengeRef = useRef(null)
    const restoreFocusTimerRef = useRef(null)
    const feedbackRef = useRef(null)
    const resultAnimationRef = useRef(null)
    const [flagValue, setFlagValue] = useState('')
    const [feedback, setFeedback] = useState(null)
    const [confettiBurst, setConfettiBurst] = useState(0)

    useEffect(() => {
        if (!challenge) return

        if (activeChallengeRef.current !== challenge) {
            activeChallengeRef.current = challenge
            previouslyFocusedRef.current = document.activeElement
        }

        // A StrictMode re-run should not schedule a focus restore.
        if (restoreFocusTimerRef.current !== null) {
            window.clearTimeout(restoreFocusTimerRef.current)
            restoreFocusTimerRef.current = null
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        closeButtonRef.current?.focus()

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose()
                return
            }

            if (event.key !== 'Tab' || !dialogRef.current) return

            const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
            if (focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow
            restoreFocusTimerRef.current = window.setTimeout(() => {
                restoreFocusTimerRef.current = null
                previouslyFocusedRef.current?.focus?.()
                previouslyFocusedRef.current = null
                activeChallengeRef.current = null
            }, 0)
        }
    }, [challenge, onClose])

    useEffect(() => {
        if (!feedback) return
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

        resultAnimationRef.current?.cancel()
        resultAnimationRef.current = dialogRef.current?.animate(
            feedback.type === 'success' ? WIN_KEYFRAMES : LOSE_KEYFRAMES,
            {
                duration: feedback.type === 'success' ? 620 : 480,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
        )

        feedbackRef.current?.animate(
            [
                { opacity: 0, transform: 'translateY(5px) scale(0.98)' },
                { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
            {
                duration: 260,
                easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
            },
        )
    }, [feedback])

    useEffect(() => {
        if (!confettiBurst) return

        const timer = window.setTimeout(() => setConfettiBurst(0), 2200)

        return () => window.clearTimeout(timer)
    }, [confettiBurst])

    if (!challenge) return null

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            {confettiBurst > 0 ? <ConfettiBurst key={confettiBurst} /> : null}

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="challenge-modal-title"
                className="relative flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl border border-neon/30 bg-[#0b0f0c] shadow-2xl md:flex-row"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close challenge"
                    className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg text-2xl leading-none text-neon/70 transition hover:bg-white/[0.06] hover:text-neon"
                >
                    ×
                </button>

                {/* LEFT: the question */}
                <section className="flex-1 overflow-y-auto p-6 md:p-8">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-neon/60">
                        {challenge.category} · {challenge.points} pts
                    </p>
                    <h2
                        id="challenge-modal-title"
                        className="mt-2 pr-10 font-mono text-3xl text-neon"
                    >
                        {challenge.name}
                    </h2>

                    <p className="mt-6 whitespace-pre-line leading-relaxed text-white/85">
                        {challenge.question}
                    </p>

                    {challenge.file && (
                        <a
                            href={challenge.file}
                            download
                            className="mt-6 inline-block rounded border border-neon/50 px-4 py-2 font-mono text-sm text-neon transition hover:bg-neon/10"
                        >
                            Download file
                        </a>
                    )}

                    <form
                        className="mt-8 flex gap-3"
                        onSubmit={(event) => {
                            event.preventDefault()

                            const submittedFlag = flagValue.trim()
                            if (!submittedFlag) {
                                setFeedback({
                                    type: 'error',
                                    message: 'Enter a flag before submitting.',
                                })
                                return
                            }

                            if (isCorrectTestFlag(challenge.id, submittedFlag)) {
                                setFeedback({
                                    type: 'success',
                                    message: `Correct flag! ${challenge.name} solved. +${challenge.points} points (test mode, not saved).`,
                                })
                                setFlagValue('')
                                setConfettiBurst((burst) => burst + 1)
                                playWinSound()
                                return
                            }

                            setFeedback({
                                type: 'error',
                                message: 'Incorrect flag. Keep digging and try again.',
                            })
                        }}
                    >
                        <label htmlFor="challenge-flag" className="sr-only">
                            Flag
                        </label>
                        <input
                            id="challenge-flag"
                            type="text"
                            value={flagValue}
                            onChange={(event) => {
                                setFlagValue(event.target.value)
                                if (feedback) setFeedback(null)
                            }}
                            placeholder="flag{...}"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            aria-invalid={feedback?.type === 'error'}
                            aria-describedby={feedback ? 'challenge-flag-feedback' : undefined}
                            className={`min-w-0 flex-1 rounded border bg-black/40 px-3 py-2 font-mono text-white outline-none transition ${feedback?.type === 'error'
                                ? 'border-red-400/60 focus:border-red-300'
                                : 'border-neon/30 focus:border-neon'
                                }`}
                        />
                        <button
                            type="submit"
                            className="rounded bg-neon px-4 py-2 font-mono text-sm font-bold text-black transition hover:opacity-90"
                        >
                            Submit
                        </button>
                    </form>

                    {feedback ? (
                        <p
                            ref={feedbackRef}
                            id="challenge-flag-feedback"
                            role="status"
                            aria-live="polite"
                            className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 font-mono text-[10px] leading-relaxed ${feedback.type === 'success'
                                ? 'border-neon/25 bg-neon/[0.06] text-neon'
                                : 'border-red-400/25 bg-red-400/[0.06] text-red-300'
                                }`}
                        >
                            <span aria-hidden="true" className="mt-px">
                                {feedback.type === 'success' ? '✓' : '!'}
                            </span>
                            <span>{feedback.message}</span>
                        </p>
                    ) : null}
                </section>

                {/* RIGHT: steps to solve */}
                <aside className="w-full overflow-y-auto border-t border-neon/20 bg-black/30 p-6 md:w-[380px] md:border-l md:border-t-0 md:p-8">
                    <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-neon/75">
                        Steps to solve
                    </h3>
                    <ol className="mt-5 space-y-4">
                        {challenge.steps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neon/50 font-mono text-xs text-neon">
                                    {index + 1}
                                </span>
                                <span className="text-sm leading-relaxed text-white/80">
                                    {renderStepText(step)}
                                </span>
                            </li>
                        ))}
                    </ol>
                </aside>
            </div>
        </div>,
        document.body,
    )
}

export default ChallengeModal
