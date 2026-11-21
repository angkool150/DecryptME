'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser, isSupabaseAuthConfigured } from '../lib/supabase-browser'
import { readJson, setSession } from '../lib/api.js'
import { emailError, passwordError, usernameError } from '../lib/validation.js'

const inputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] pl-11 pr-4 text-sm text-white placeholder:text-white/45 transition ' +
  'hover:border-white/15 focus:border-neon/50 focus:bg-neon/[0.02] focus:outline-none focus:ring-4 focus:ring-neon/10 ' +
  'aria-invalid:border-red-400/50 aria-invalid:focus:border-red-400/60 aria-invalid:focus:ring-red-400/10'

const plainInputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white placeholder:text-white/45 transition ' +
  'hover:border-white/15 focus:border-neon/50 focus:bg-neon/[0.02] focus:outline-none focus:ring-4 focus:ring-neon/10'

const socialButtonClass =
  'group flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.025] text-[13px] font-medium ' +
  'text-white/80 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'

function safeText(value, max) {
  return String(value ?? '').slice(0, max)
}

function Login() {
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const [signIn, setSignIn] = useState({ handle: '', password: '' })
  const [signUp, setSignUp] = useState({ username: '', email: '', password: '', confirm: '' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const authConfigured = isSupabaseAuthConfigured()

  function setModeSafe(next) {
    setMode(next)
    setStatus(null)
    setLoading(false)
  }

  function onCaps(event) {
    setCapsLock(event.getModifierState?.('CapsLock') ?? false)
  }

  async function handleGoogle() {
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      setStatus({ type: 'error', text: 'Google sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and reload.' })
      return
    }
    setLoading(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setStatus({ type: 'error', text: error.message || 'Could not start Google sign-in.' })
      setLoading(false)
    }
  }

  async function handleSignIn(event) {
    event.preventDefault()
    if (loading) return

    const username = safeText(signIn.handle, 254).trim()
    const password = safeText(signIn.password, 128)
    if (!username || !password) {
      setStatus({ type: 'error', text: 'Enter your handle or email and password to continue.' })
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data.error || 'Failed to authenticate.')
      setSession(data.token, data.user)
      window.location.href = '/'
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Login failed. Please check your credentials.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(event) {
    event.preventDefault()
    if (loading) return

    const username = safeText(signUp.username, 32).trim()
    const email = safeText(signUp.email, 254).trim().toLowerCase()
    const password = safeText(signUp.password, 128)
    const confirm = safeText(signUp.confirm, 128)

    const usernameMessage = usernameError(username)
    if (usernameMessage) {
      setStatus({ type: 'error', text: usernameMessage })
      return
    }
    const emailMessage = emailError(email)
    if (emailMessage) {
      setStatus({ type: 'error', text: emailMessage })
      return
    }
    const passwordMessage = passwordError(password, confirm)
    if (passwordMessage) {
      setStatus({ type: 'error', text: passwordMessage })
      return
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      setStatus({ type: 'error', text: 'Account creation needs email verification. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and reload.' })
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      const reg = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const regData = await readJson(reg)
      if (!reg.ok) throw new Error(regData.error || 'Could not create account.')

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error && !/already registered|already exists/i.test(error.message || '')) {
        throw new Error(error.message || 'Could not send verification email.')
      }

      setStatus({
        type: 'info',
        text: 'Verification email sent. Open the link in your email to activate your account, then sign in.',
      })
      setSignUp({ username: '', email: '', password: '', confirm: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Could not create account.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(event) {
    event.preventDefault()
    if (loading) return
    const email = safeText(forgotEmail, 254).trim().toLowerCase()
    const emailMessage = emailError(email)
    if (emailMessage) {
      setStatus({ type: 'error', text: emailMessage })
      return
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      setStatus({ type: 'error', text: 'Password reset is not configured. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and reload.' })
      return
    }

    setLoading(true)
    setStatus(null)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // Generic response to avoid account enumeration.
      setStatus({ type: 'info', text: 'If an account exists for that email, a reset link has been sent.' })
      setForgotEmail('')
    } catch {
      setStatus({ type: 'info', text: 'If an account exists for that email, a reset link has been sent.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-void">
      <AuthBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-1 flex-col px-5 sm:px-8">
        <Header />

        <main className="grid flex-1 items-center gap-12 pb-10 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)] lg:gap-16 lg:pb-6 lg:pt-4 xl:gap-24">
          <BrandPanel />
          <AuthCard
            mode={mode}
            setMode={setModeSafe}
            status={status}
            loading={loading}
            authConfigured={authConfigured}
            signIn={signIn}
            setSignIn={setSignIn}
            signUp={signUp}
            setSignUp={setSignUp}
            forgotEmail={forgotEmail}
            setForgotEmail={setForgotEmail}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            capsLock={capsLock}
            onCaps={onCaps}
            onGoogle={handleGoogle}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onForgot={handleForgot}
          />
        </main>

        <Footer />
      </div>
    </div>
  )
}

function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="auth-backdrop absolute inset-0" />
      <div className="bg-grid grid-fade absolute inset-0 opacity-50" />
      <img
        src="/decryptme-logo.svg"
        alt=""
        className="absolute -left-40 top-1/2 hidden w-[720px] max-w-none -translate-y-1/2 opacity-[0.025] lg:block xl:-left-24 xl:w-[780px]"
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-6 py-5 sm:py-6">
      <a href="/" className="group flex items-center gap-3">
        <img src="/decryptme-logo.svg" alt="" className="h-9 w-auto drop-shadow-[0_0_16px_rgba(115,247,109,0.22)] transition-transform duration-300 group-hover:-rotate-3" />
        <span className="flex items-center gap-2">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">decryptme</span>
          <span className="rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-neon">ctf</span>
        </span>
      </a>
      <a href="#" className="text-[13px] font-medium text-muted transition hover:text-white">Need help?</a>
    </header>
  )
}

function formatStat(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(num)
}

function BrandPanel() {
  const [dbStats, setDbStats] = useState({ operators: 0, challenges: 0, flagsCaptured: 0 })

  useEffect(() => {
    fetch('/api/auth/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setDbStats(data) })
      .catch(() => {})
  }, [])

  const stats = [
    { value: formatStat(dbStats.operators), label: 'Operators' },
    { value: formatStat(dbStats.challenges), label: 'Total challenges' },
    { value: formatStat(dbStats.flagsCaptured), label: 'Flags captured' },
  ]

  return (
    <section aria-labelledby="brand-heading" className="hidden flex-col justify-center lg:flex">
      <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-neon" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Secure access portal</span>
      </div>
      <h1 id="brand-heading" className="mt-7 max-w-[14ch] text-[clamp(2.9rem,4.1vw,4.1rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white">
        Decrypt the <span className="glow-text text-neon">challenge</span>.
        <span className="mt-2 block text-white/90">Capture the flag.</span>
      </h1>
      <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-muted">
        The arena for hackers, builders, and problem-solvers. Sign in to pick up where you left off.
      </p>
      <div className="mt-9 grid max-w-[440px] grid-cols-3 border-y border-white/[0.08] py-5">
        {stats.map((stat, index) => (
          <div key={stat.label} className={index > 0 ? 'border-l border-white/[0.08] pl-5' : ''}>
            <div className="text-xl font-semibold tracking-[-0.02em] text-white">{stat.value}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted/80">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AuthCard(props) {
  const { mode, setMode, status, loading, authConfigured } = props
  const titles = {
    signin: ['Welcome back, operator.', 'Sign in to resume your challenges and keep your streak alive.'],
    signup: ['Create your account.', 'Register with email verification, or continue with Google.'],
    forgot: ['Reset your password.', 'We’ll email you a secure link to set a new password.'],
  }
  const [title, subtitle] = titles[mode]

  return (
    <section aria-labelledby="login-heading" className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div aria-hidden="true" className="absolute -inset-8 rounded-[48px] bg-neon/[0.045] blur-3xl" />
      <div className="relative">
        <div aria-hidden="true" className="absolute -inset-px rounded-[26px] bg-gradient-to-b from-white/15 via-white/[0.04] to-transparent" />
        <div className="relative overflow-hidden rounded-[25px] border border-white/[0.06] bg-[#080e0b]/95 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-7">
          <div aria-hidden="true" className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-neon/80 to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                <LockIcon className="size-3 text-neon" />
                {mode === 'signin' ? 'Secure sign-in' : mode === 'signup' ? 'Create account' : 'Password recovery'}
              </span>
            </div>

            <h2 id="login-heading" className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[30px]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

            {mode !== 'forgot' ? (
              <>
                <div className="mt-5">
                  <button type="button" onClick={props.onGoogle} disabled={loading} className={socialButtonClass}>
                    <GoogleIcon className="size-4" />
                    {loading && mode === 'signin' ? 'Redirecting…' : 'Continue with Google'}
                  </button>
                </div>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/[0.07]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted/90">or use email</span>
                  <span className="h-px flex-1 bg-white/[0.07]" />
                </div>
              </>
            ) : null}

            {mode === 'signin' ? <SignInForm {...props} /> : null}
            {mode === 'signup' ? <SignUpForm {...props} /> : null}
            {mode === 'forgot' ? <ForgotForm {...props} /> : null}

            {!authConfigured && mode !== 'signin' ? (
              <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[11.5px] text-amber-200">
                Email verification and Google sign-in require <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in your environment.
              </p>
            ) : null}

            <StatusMessage status={status} />

            <div className="mt-5 space-y-2 text-center text-[13px] text-muted">
              {mode === 'signin' ? (
                <>
                  <p>New to decryptme? <button type="button" onClick={() => setMode('signup')} className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">Create an operator account</button></p>
                </>
              ) : (
                <p><button type="button" onClick={() => setMode('signin')} className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">Back to sign in</button></p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/90">
              <LockIcon className="size-3 text-neon/50" />
              TLS · parameterized queries · rate limited · audited
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusMessage({ status }) {
  if (!status?.text) return null
  const error = status.type === 'error'
  return (
    <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[11.5px] leading-relaxed ${error ? 'border-red-400/20 bg-red-400/[0.06] text-red-200' : 'border-neon/20 bg-neon/[0.06] text-neon/90'}`}>
      {error ? <AlertIcon className="mt-px size-3.5 shrink-0" /> : <InfoIcon className="mt-px size-3.5 shrink-0" />}
      <p>{status.text}</p>
    </div>
  )
}

function SignInForm({ signIn, setSignIn, showPassword, setShowPassword, capsLock, onCaps, loading, onSignIn, setMode }) {
  return (
    <form onSubmit={onSignIn} noValidate>
      <div>
        <label htmlFor="handle" className="text-[12.5px] font-medium text-white/80">Handle or email</label>
        <div className="group relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-white/30 transition group-focus-within:text-neon/80"><UserIcon className="size-[17px]" /></span>
          <input id="handle" name="username" type="text" autoComplete="username" spellCheck="false" maxLength={254} required
            placeholder="r3v3rs3r" value={signIn.handle} onChange={(e) => setSignIn((c) => ({ ...c, handle: safeText(e.target.value, 254) }))} className={inputClass} />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-[12.5px] font-medium text-white/80">Password</label>
          <button type="button" onClick={() => setMode('forgot')} className="text-[11.5px] font-medium text-neon/85 transition hover:text-neon-bright">Forgot password?</button>
        </div>
        <div className="group relative mt-2">
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-white/30 transition group-focus-within:text-neon/80"><LockIcon className="size-[17px]" /></span>
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" maxLength={128} required
            placeholder="••••••••••••" value={signIn.password} onChange={(e) => setSignIn((c) => ({ ...c, password: safeText(e.target.value, 128) }))}
            onKeyDown={onCaps} onKeyUp={onCaps} onBlur={() => {}} className={`${inputClass} pr-12`} />
          <button type="button" onClick={() => setShowPassword((c) => !c)} aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/35 transition hover:text-white/70">
            {showPassword ? <EyeOffIcon className="size-[17px]" /> : <EyeIcon className="size-[17px]" />}
          </button>
        </div>
        {capsLock ? <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-300/80">Caps Lock is on</p> : null}
      </div>
      <button type="submit" disabled={loading} className="group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon text-[14px] font-semibold text-[#04120a] transition hover:bg-neon-bright disabled:cursor-wait disabled:opacity-70">
        {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-[#04120a]/25 border-t-[#04120a]" />Authenticating…</> : <>Sign in <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" /></>}
      </button>
    </form>
  )
}

function SignUpForm({ signUp, setSignUp, loading, onSignUp }) {
  return (
    <form onSubmit={onSignUp} noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="su-username" className="text-[12.5px] font-medium text-white/80">Username</label>
          <input id="su-username" type="text" autoComplete="username" spellCheck="false" maxLength={32} required placeholder="r3v3rs3r"
            value={signUp.username} onChange={(e) => setSignUp((c) => ({ ...c, username: safeText(e.target.value, 32) }))} className={`${plainInputClass} mt-2`} />
        </div>
        <div>
          <label htmlFor="su-email" className="text-[12.5px] font-medium text-white/80">Email</label>
          <input id="su-email" type="email" autoComplete="email" maxLength={254} required placeholder="operator@example.com"
            value={signUp.email} onChange={(e) => setSignUp((c) => ({ ...c, email: safeText(e.target.value, 254) }))} className={`${plainInputClass} mt-2`} />
        </div>
        <div>
          <label htmlFor="su-password" className="text-[12.5px] font-medium text-white/80">Password</label>
          <input id="su-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required placeholder="At least 8 characters"
            value={signUp.password} onChange={(e) => setSignUp((c) => ({ ...c, password: safeText(e.target.value, 128) }))} className={`${plainInputClass} mt-2`} />
        </div>
        <div>
          <label htmlFor="su-confirm" className="text-[12.5px] font-medium text-white/80">Confirm password</label>
          <input id="su-confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required placeholder="Repeat password"
            value={signUp.confirm} onChange={(e) => setSignUp((c) => ({ ...c, confirm: safeText(e.target.value, 128) }))} className={`${plainInputClass} mt-2`} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon text-[14px] font-semibold text-[#04120a] transition hover:bg-neon-bright disabled:cursor-wait disabled:opacity-70">
        {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-[#04120a]/25 border-t-[#04120a]" />Creating account…</> : <>Create account <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" /></>}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted/90">You’ll receive an email verification link before you can sign in.</p>
    </form>
  )
}

function ForgotForm({ forgotEmail, setForgotEmail, loading, onForgot }) {
  return (
    <form onSubmit={onForgot} noValidate>
      <div>
        <label htmlFor="forgot-email" className="text-[12.5px] font-medium text-white/80">Email</label>
        <input id="forgot-email" type="email" autoComplete="email" maxLength={254} required placeholder="operator@example.com"
          value={forgotEmail} onChange={(e) => setForgotEmail(safeText(e.target.value, 254))} className={`${plainInputClass} mt-2`} />
      </div>
      <button type="submit" disabled={loading} className="group mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon text-[14px] font-semibold text-[#04120a] transition hover:bg-neon-bright disabled:cursor-wait disabled:opacity-70">
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-5">
      <p className="mb-2 text-center text-[12px] text-muted">
        <a href="/privacy" className="underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">Privacy policy</a>
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/90">© 2026 decryptme · authorized operators only</p>
    </footer>
  )
}

function UserIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" /></svg>)
}
function LockIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10.5" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /><path d="M12 14.5v2" /></svg>)
}
function EyeIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.75" /></svg>)
}
function EyeOffIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4l16 16" /><path d="M9.9 5.1A10.6 10.6 0 0 1 12 4.9c6 0 9.5 5.5 9.5 5.5a17.6 17.6 0 0 1-3.2 3.8" /><path d="M6.6 6.7A17 17 0 0 0 2.5 10.4S6 15.9 12 15.9a10 10 0 0 0 4.1-.85" /><path d="M10.4 10.4a2.75 2.75 0 0 0 3.2 3.2" /></svg>)
}
function ArrowRightIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></svg>)
}
function AlertIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5V13" /><circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" /></svg>)
}
function InfoIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><circle cx="12" cy="7.75" r="0.75" fill="currentColor" stroke="none" /></svg>)
}
function GoogleIcon({ className }) {
  return (<svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" /></svg>)
}

export default Login
