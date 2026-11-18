'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/src/lib/supabase-browser'
import { readJson } from '@/src/lib/api.js'
import { passwordError } from '@/src/lib/validation.js'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [ready, setReady] = useState(false)
    const [status, setStatus] = useState({ type: '', text: '' })

    useEffect(() => {
        async function run() {
            const supabase = getSupabaseBrowser()
            if (!supabase) {
                setStatus({ type: 'error', text: 'Authentication is not configured.' })
                return
            }
            try {
                const params = new URLSearchParams(window.location.search)
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
                const code = params.get('code')
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (error) throw error
                }
                const accessToken = hash.get('access_token')
                const refreshToken = hash.get('refresh_token')
                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                    if (error) throw error
                }
                const { data } = await supabase.auth.getSession()
                if (!data?.session) throw new Error('Recovery session is missing or expired. Request a new reset link.')
                setReady(true)
            } catch (err) {
                setStatus({ type: 'error', text: err.message || 'Could not open recovery session.' })
            }
        }
        run()
    }, [])

    async function handleSubmit(event) {
        event.preventDefault()
        if (loading) return
        const passwordMessage = passwordError(password, confirm)
        if (passwordMessage) {
            setStatus({ type: 'error', text: passwordMessage })
            return
        }

        const supabase = getSupabaseBrowser()
        if (!supabase) return
        setLoading(true)
        setStatus({ type: '', text: '' })

        try {
            const { data } = await supabase.auth.getSession()
            const session = data?.session
            if (!session?.access_token) throw new Error('Recovery session expired. Request a new reset link.')

            const { error: updateError } = await supabase.auth.updateUser({ password })
            if (updateError) throw updateError

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: session.access_token, password }),
            })
            const payload = await readJson(response, { fallback: {} })
            if (!response.ok) throw new Error(payload.error || 'Could not update password.')

            await supabase.auth.signOut().catch(() => {})
            setStatus({ type: 'success', text: 'Password updated. Redirecting to sign in…' })
            window.setTimeout(() => window.location.replace('/login'), 1200)
        } catch (err) {
            setStatus({ type: 'error', text: err.message || 'Could not reset password.' })
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white placeholder:text-white/45 transition hover:border-white/15 focus:border-neon/50 focus:bg-neon/[0.02] focus:outline-none focus:ring-4 focus:ring-neon/10'

    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-void px-6">
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="auth-backdrop absolute inset-0" />
                <div className="bg-grid grid-fade absolute inset-0 opacity-50" />
            </div>
            <div className="relative w-full max-w-md rounded-[25px] border border-white/[0.08] bg-[#080e0b]/95 p-7 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
                <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-white">Set a new password</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">Choose a strong password for your operator account.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="new-password" className="text-[12.5px] font-medium text-white/80">New password</label>
                        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required disabled={!ready || loading}
                            value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} mt-2`} placeholder="At least 8 characters" />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="text-[12.5px] font-medium text-white/80">Confirm password</label>
                        <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required disabled={!ready || loading}
                            value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputClass} mt-2`} placeholder="Repeat password" />
                    </div>

                    {status.text ? (
                        <div className={`rounded-lg border px-3 py-2.5 text-[11.5px] ${status.type === 'error' ? 'border-red-400/20 bg-red-400/[0.06] text-red-200' : 'border-neon/20 bg-neon/[0.06] text-neon/90'}`}>
                            {status.text}
                        </div>
                    ) : null}

                    <button type="submit" disabled={!ready || loading}
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-neon text-[14px] font-semibold text-[#04120a] transition hover:bg-neon-bright disabled:cursor-wait disabled:opacity-60">
                        {loading ? 'Updating…' : 'Update password'}
                    </button>
                </form>

                <p className="mt-5 text-center text-[13px] text-muted">
                    <a href="/login" className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">Back to sign in</a>
                </p>
            </div>
        </div>
    )
}
