'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getToken } from '../lib/api.js'

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
            context.close().catch(() => { })
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

function StepsPanel({ steps }) {
    const [stepsOpen, setStepsOpen] = useState(false)
    const [openWiki, setOpenWiki] = useState(null) // index of expanded wiki entry

    const toggleWiki = (index) =>
        setOpenWiki((prev) => (prev === index ? null : index))

    return (
        <div className="w-full border-t border-neon/20 md:w-[380px] md:border-l md:border-t-0">
            {/* ── Steps toggle header ── */}
            <button
                type="button"
                onClick={() => {
                    setStepsOpen((prev) => !prev)
                    if (stepsOpen) setOpenWiki(null)
                }}
                aria-expanded={stepsOpen}
                className="flex w-full items-center justify-between gap-3 bg-black/30 px-6 py-4 pr-14 text-left transition hover:bg-white/[0.03] md:pl-8 md:pr-14"
            >
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-neon/75">
                    Steps to solve
                </span>
                <span
                    aria-hidden="true"
                    className={`text-neon/60 transition-transform duration-300 ${stepsOpen ? 'rotate-180' : 'rotate-0'}`}
                >
                    ▾
                </span>
            </button>

            {/* ── Collapsible body ── */}
            {stepsOpen && (
                <div className="overflow-y-auto bg-black/30 px-6 pb-6 md:max-h-[calc(90vh-56px)] md:px-8">
                    <ol className="mt-5 space-y-3">
                        {steps.map((step, index) => (
                            <li key={index} className="rounded-lg border border-neon/10 bg-black/20">
                                {/* Step row */}
                                <div className="flex gap-3 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neon/50 font-mono text-xs text-neon">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 text-sm leading-relaxed text-white/80">
                                        {renderStepText(step.text ?? step)}
                                    </span>
                                </div>

                                {/* Wiki toggle — only shown when the step has an info entry */}
                                {step.info && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => toggleWiki(index)}
                                            aria-expanded={openWiki === index}
                                            className="flex w-full items-center gap-2 border-t border-neon/10 px-3 py-2 text-left transition hover:bg-white/[0.03]"
                                        >
                                            <span className="font-mono text-[10px] uppercase tracking-widest text-neon/50">
                                                📖 Learn more
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className={`ml-auto text-xs text-neon/40 transition-transform duration-200 ${openWiki === index ? 'rotate-180' : 'rotate-0'}`}
                                            >
                                                ▾
                                            </span>
                                        </button>

                                        {openWiki === index && (
                                            <div className="border-t border-neon/10 bg-neon/[0.03] px-4 py-3">
                                                {step.info.title && (
                                                    <p className="mb-1 font-mono text-xs font-semibold text-neon/80">
                                                        {step.info.title}
                                                    </p>
                                                )}
                                                <p className="text-xs leading-relaxed text-white/65">
                                                    {step.info.body}
                                                </p>
                                                {step.info.link && (
                                                    <a
                                                        href={step.info.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 inline-block font-mono text-[10px] text-neon underline decoration-neon/40 underline-offset-2 transition hover:decoration-neon"
                                                    >
                                                        → Open resource
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    )
}

function ChallengeModal({ challenge, onClose, onSolved }) {
    const dialogRef = useRef(null)
    const closeButtonRef = useRef(null)
    const previouslyFocusedRef = useRef(null)
    const activeChallengeRef = useRef(null)
    const restoreFocusTimerRef = useRef(null)
    const feedbackRef = useRef(null)
    const resultAnimationRef = useRef(null)
    const [flagValue, setFlagValue] = useState('')
    const [feedback, setFeedback] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
                        onSubmit={async (event) => {
                            event.preventDefault()
                            if (isSubmitting) return

                            const submittedFlag = flagValue.trim()
                            if (!submittedFlag) {
                                setFeedback({
                                    type: 'error',
                                    message: 'Enter a flag before submitting.',
                                })
                                return
                            }

                            setIsSubmitting(true)
                            setFeedback(null)

                            try {
                                const token = getToken()
                                const slug = challenge.slug || challenge.id
                                const res = await fetch(`/api/challenges/${slug}/submit`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                    body: JSON.stringify({ flag: submittedFlag }),
                                })

                                const data = await res.json()

                                if (!res.ok) {
                                    throw new Error(data.error || 'Submission failed.')
                                }

                                if (data.correct) {
                                    setFeedback({
                                        type: 'success',
                                        message: data.message || `Correct flag! Solved +${challenge.points} points.`,
                                    })
                                    setFlagValue('')
                                    setConfettiBurst((burst) => burst + 1)
                                    playWinSound()
                                    if (onSolved) onSolved(challenge.id)
                                } else {
                                    setFeedback({
                                        type: 'error',
                                        message: data.message || 'Incorrect flag. Keep digging and try again.',
                                    })
                                }
                            } catch (err) {
                                setFeedback({
                                    type: 'error',
                                    message: err.message || 'Error communicating with database.',
                                })
                            } finally {
                                setIsSubmitting(false)
                            }
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
                            disabled={isSubmitting}
                            className="rounded bg-neon px-4 py-2 font-mono text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Checking…' : 'Submit'}
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

                {/* RIGHT: steps to solve (collapsible) + per-step wiki */}
                <StepsPanel steps={challenge.steps} />
            </div>
        </div>,
        document.body,
    )
}

export default ChallengeModal
