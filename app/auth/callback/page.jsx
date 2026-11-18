'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/src/lib/supabase-browser'
import { readJson, setSession } from '@/src/lib/api.js'

export default function AuthCallbackPage() {
    const [message, setMessage] = useState('Completing sign-in…')
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        async function run() {
            const supabase = getSupabaseBrowser()
            if (!supabase) {
                setError('Authentication is not configured. Add the Supabase publishable key and reload.')
                return
            }

            try {
                const params = new URLSearchParams(window.location.search)
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
                const code = params.get('code')
                const type = params.get('type') || hash.get('type')

                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    if (exchangeError) throw exchangeError
                }

                const { data, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) throw sessionError
                const session = data?.session
                if (!session?.access_token) throw new Error('No session was returned. Try signing in again.')

                if (type === 'recovery') {
                    window.location.replace(`/reset-password#access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token || '')}&type=recovery`)
                    return
                }

                if (active) setMessage('Linking your account…')
                const response = await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: session.access_token }),
                })
                const payload = await readJson(response, { fallback: {} })
                if (!response.ok) throw new Error(payload.error || 'Could not complete sign-in.')

                setSession(payload.token, payload.user)
                await supabase.auth.signOut().catch(() => {})

                if (active) setMessage('Signed in. Redirecting…')
                window.location.replace('/')
            } catch (err) {
                console.error('[auth/callback]', err)
                if (active) setError(err.message || 'Sign-in failed. Please try again.')
            }
        }

        run()
        return () => {
            active = false
        }
    }, [])

    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-void px-6">
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="auth-backdrop absolute inset-0" />
                <div className="bg-grid grid-fade absolute inset-0 opacity-50" />
            </div>
            <div className="relative w-full max-w-md rounded-[25px] border border-white/[0.08] bg-[#080e0b]/95 p-8 text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
                <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-neon/20 bg-neon/[0.06]">
                    {error ? (
                        <span className="text-lg text-red-300">!</span>
                    ) : (
                        <span className="size-5 animate-spin rounded-full border-2 border-neon/25 border-t-neon" />
                    )}
                </div>
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-white">{error ? 'Sign-in failed' : 'Almost there'}</h1>
                <p className={`mt-3 text-sm leading-relaxed ${error ? 'text-red-200' : 'text-muted'}`}>{error || message}</p>
                {error ? (
                    <a
                        href="/login"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-neon px-5 text-sm font-semibold text-[#04120a] transition hover:bg-neon-bright"
                    >
                        Back to sign in
                    </a>
                ) : null}
            </div>
        </div>
    )
}
