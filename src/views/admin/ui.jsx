'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export { initials } from '../../lib/format.js'

export function cx(...classes) {
    return classes.filter(Boolean).join(' ')
}

export function formatDateTime(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

export function formatRelative(value) {
    if (!value) return 'Never'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Never'
    const seconds = Math.round((Date.now() - date.getTime()) / 1000)

    if (seconds < 15) return 'Just now'
    if (seconds < 90) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.round(seconds / 86400)}d ago`
    return formatDateTime(value)
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'neon' }) {
    const toneClass = tone === 'red'
        ? 'text-red-300'
        : tone === 'amber'
            ? 'text-amber-300'
            : 'text-neon'

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#080d0a]/85 p-4">
            <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</p>
                {Icon ? <Icon className={cx('size-4 shrink-0', toneClass, 'opacity-70')} /> : null}
            </div>
            <p className={cx('mt-3 text-[26px] font-semibold leading-none tracking-tight', toneClass)}>{value}</p>
            {detail ? <p className="mt-2 text-[10px] leading-relaxed text-muted">{detail}</p> : null}
        </div>
    )
}

export function MiniStat({ label, value, tone = 'text-white' }) {
    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#080d0a]/85 px-4 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{label}</p>
            <p className={cx('mt-1.5 text-[20px] font-semibold leading-none', tone)}>{value}</p>
        </div>
    )
}

export function Panel({ title, description, actions, children, className = '', bodyClassName = '' }) {
    return (
        <section className={cx('overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d0a]/85 backdrop-blur-sm', className)}>
            {(title || actions) ? (
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
                    <div>
                        {title ? <h2 className="text-[14px] font-semibold text-white">{title}</h2> : null}
                        {description ? <p className="mt-1 text-[11px] text-muted">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            <div className={bodyClassName}>{children}</div>
        </section>
    )
}

const BADGE_TONES = {
    neon: 'border-neon/25 bg-neon/[0.08] text-neon',
    red: 'border-red-400/25 bg-red-400/[0.07] text-red-300',
    amber: 'border-amber-400/25 bg-amber-400/[0.07] text-amber-300',
    blue: 'border-sky-400/25 bg-sky-400/[0.07] text-sky-300',
    muted: 'border-white/[0.08] bg-white/[0.03] text-muted',
}

export function Badge({ tone = 'muted', children, className = '' }) {
    return (
        <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]', BADGE_TONES[tone] || BADGE_TONES.muted, className)}>
            {children}
        </span>
    )
}

export function EmptyState({ title = 'Nothing here yet', description = '' }) {
    return (
        <div className="grid min-h-32 place-items-center px-6 py-10 text-center">
            <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted/80">{title}</p>
                {description ? <p className="mt-2 max-w-md text-[11px] leading-relaxed text-muted">{description}</p> : null}
            </div>
        </div>
    )
}

export function Spinner({ label = 'Loading…' }) {
    return (
        <div className="flex min-h-32 items-center justify-center gap-2 font-mono text-[11px] text-neon/70">
            <span className="size-3 animate-spin rounded-full border-2 border-neon/20 border-t-neon" />
            {label}
        </div>
    )
}

export function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-[12px] text-red-200">
            {message}
        </div>
    )
}

export function NoticeBanner({ message, onDismiss }) {
    if (!message) return null
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-neon/20 bg-neon/[0.05] px-4 py-2.5 text-[11.5px] text-neon">
            <span>{message}</span>
            {onDismiss ? (
                <button type="button" onClick={onDismiss} className="text-neon/60 hover:text-neon">×</button>
            ) : null}
        </div>
    )
}

export function Modal({ open, onClose, title, description, children, width = 'max-w-3xl' }) {
    useEffect(() => {
        if (!open) return undefined

        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose()
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, onClose])

    if (!open) return null

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cx('relative my-6 w-full overflow-hidden rounded-2xl border border-neon/20 bg-[#080e0b] shadow-2xl', width)}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
                    <div>
                        <h2 className="text-[16px] font-semibold text-white">{title}</h2>
                        {description ? <p className="mt-1 text-[11px] text-muted">{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-lg text-muted transition hover:bg-white/[0.06] hover:text-white"
                    >
                        ×
                    </button>
                </div>
                <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5">{children}</div>
            </div>
        </div>,
        document.body
    )
}

const selectBaseClass =
    'w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/[0.025] px-3 pr-10 text-[12.5px] text-white outline-none transition [color-scheme:dark] hover:border-white/15 focus:border-neon/50 focus:ring-4 focus:ring-neon/10 disabled:cursor-not-allowed disabled:opacity-50'

export const inputClass =
    'h-10 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3 text-[12.5px] text-white placeholder:text-white/35 outline-none transition hover:border-white/15 focus:border-neon/50 focus:ring-4 focus:ring-neon/10'

export const selectClass = `${selectBaseClass} h-10`

export const selectSmClass = `${selectBaseClass} h-9`

export const textareaClass =
    'w-full rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-[12.5px] leading-relaxed text-white placeholder:text-white/35 outline-none transition hover:border-white/15 focus:border-neon/50 focus:ring-4 focus:ring-neon/10'

export function SelectChevron({ className = '' }) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className={cx('pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted', className)}
        >
            <path
                d="M5.5 7.75 10 12.25l4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function Select({
    children,
    className = '',
    containerClassName = '',
    size = 'md',
    ...props
}) {
    return (
        <div className={cx('relative', containerClassName)}>
            <select
                {...props}
                className={cx(size === 'sm' ? selectSmClass : selectClass, className)}
            >
                {children}
            </select>
            <SelectChevron />
        </div>
    )
}

export function Field({ label, hint, children, className = '' }) {
    return (
        <label className={cx('block', className)}>
            <span className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[11.5px] font-medium text-white/80">{label}</span>
                {hint ? <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">{hint}</span> : null}
            </span>
            {children}
        </label>
    )
}

export function PrimaryButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={cx(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neon px-3.5 text-[11.5px] font-semibold text-[#04120a] transition hover:bg-neon-bright disabled:cursor-wait disabled:opacity-50',
                className
            )}
        >
            {children}
        </button>
    )
}

export function SecondaryButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={cx(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-[11.5px] font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-wait disabled:opacity-50',
                className
            )}
        >
            {children}
        </button>
    )
}

export function DangerButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={cx(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3.5 text-[11.5px] font-medium text-red-300 transition hover:border-red-400/35 hover:bg-red-400/[0.1] disabled:cursor-wait disabled:opacity-50',
                className
            )}
        >
            {children}
        </button>
    )
}

const ROW_BUTTON_TONES = {
    default: 'border-white/10 text-white/70 hover:border-neon/30 hover:text-neon',
    danger: 'border-red-400/15 text-red-300/80 hover:border-red-400/30',
    warning: 'border-amber-400/20 text-amber-300/80 hover:border-amber-400/40',
    success: 'border-neon/20 text-neon/80 hover:border-neon/40',
}

export function RowButton({ tone = 'default', className = '', children, ...props }) {
    return (
        <button
            {...props}
            type="button"
            className={cx(
                'rounded-md border px-2 py-1 text-[9.5px]',
                ROW_BUTTON_TONES[tone] || ROW_BUTTON_TONES.default,
                className
            )}
        >
            {children}
        </button>
    )
}
