import { useEffect, useRef, useState } from 'react'

const inputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] pl-11 pr-4 text-sm text-white placeholder:text-white/45 transition ' +
  'hover:border-white/15 focus:border-neon/50 focus:bg-neon/[0.02] focus:outline-none focus:ring-4 focus:ring-neon/10 ' +
  'aria-invalid:border-red-400/50 aria-invalid:focus:border-red-400/60 aria-invalid:focus:ring-red-400/10'

const socialButtonClass =
  'group flex h-11 items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.025] text-[13px] font-medium ' +
  'text-white/80 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-[0.99]'

function Login() {
  const [form, setForm] = useState({ handle: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const timerRef = useRef(null)
  const handleRef = useRef(null)
  const passwordRef = useRef(null)

  useEffect(() => {
    document.title = 'Sign in · decryptme'

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      if (status?.type === 'error') setStatus(null)
    }
  }

  function handleSso(provider) {
    setStatus({
      type: 'info',
      text: `${provider} SSO is not configured in this demo. Use your operator credentials below.`,
    })
  }

  function handlePasswordKey(event) {
    setCapsLock(event.getModifierState?.('CapsLock') ?? false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    if (!form.handle.trim() || !form.password) {
      setStatus({ type: 'error', text: 'Enter your handle and password to continue.' })
      if (!form.handle.trim()) handleRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    setStatus(null)
    setLoading(true)

    // Demo only: replace this timeout with a request to your auth API.
    timerRef.current = window.setTimeout(() => {
      setLoading(false)
      setStatus({
        type: 'info',
        text: 'Demo mode — connect this form to your authentication API to sign in.',
      })
    }, 1500)
  }

  const handleInvalid = status?.type === 'error' && !form.handle.trim()
  const passwordInvalid = status?.type === 'error' && !form.password

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-void">
      <AuthBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-1 flex-col px-5 sm:px-8">
        <Header />

        <main className="grid flex-1 items-center gap-12 pb-10 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)] lg:gap-16 lg:pb-6 lg:pt-4 xl:gap-24">
          <BrandPanel />
          <AuthCard
            form={form}
            updateField={updateField}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            remember={remember}
            setRemember={setRemember}
            capsLock={capsLock}
            handlePasswordKey={handlePasswordKey}
            loading={loading}
            status={status}
            handleSubmit={handleSubmit}
            handleSso={handleSso}
            handleRef={handleRef}
            passwordRef={passwordRef}
            handleInvalid={handleInvalid}
            passwordInvalid={passwordInvalid}
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
        <img
          src="/decryptme-logo.svg"
          alt=""
          className="h-9 w-auto drop-shadow-[0_0_16px_rgba(115,247,109,0.22)] transition-transform duration-300 group-hover:-rotate-3"
        />
        <span className="flex items-center gap-2">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">decryptme</span>
          <span className="rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-neon">
            ctf
          </span>
        </span>
      </a>

      <div className="flex items-center gap-5 sm:gap-7">
        <span className="hidden items-center gap-2.5 sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon/50 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-neon" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Systems operational</span>
        </span>

        <a
          href="#"
          className="text-[13px] font-medium text-muted transition hover:text-white"
        >
          Need help?
        </a>
      </div>
    </header>
  )
}

function BrandPanel() {
  const stats = [
    { value: '4.2k', label: 'Operators' },
    { value: '312', label: 'Challenges' },
    { value: '98k', label: 'Flags captured' },
  ]

  return (
    <section aria-labelledby="brand-heading" className="hidden flex-col justify-center lg:flex">
      <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-neon" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Secure access portal</span>
        <span className="font-mono text-[9px] tracking-[0.12em] text-neon/50">// 0xA17</span>
      </div>

      <h1
        id="brand-heading"
        className="mt-7 max-w-[14ch] text-[clamp(2.9rem,4.1vw,4.1rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white"
      >
        Decrypt the <span className="glow-text text-neon">challenge</span>.
        <span className="mt-2 block text-white/90">Capture the flag.</span>
      </h1>

      <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-muted">
        The arena for hackers, builders, and problem-solvers. Sign in to pick up where you left off — new
        challenges drop every Friday at 18:00 UTC.
      </p>

      <div className="mt-9 grid max-w-[440px] grid-cols-3 border-y border-white/[0.08] py-5">
        {stats.map((stat, index) => (
          <div key={stat.label} className={index > 0 ? 'border-l border-white/[0.08] pl-5' : ''}>
            <div className="text-xl font-semibold tracking-[-0.02em] text-white">{stat.value}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted/80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 w-full max-w-[470px] overflow-hidden rounded-xl border border-white/[0.09] bg-[#060b08]/80 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.9)] backdrop-blur-sm">
        <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-neon/50" />
          <span className="ml-2 truncate font-mono text-[10px] tracking-wide text-muted">
            guest@decryptme: ~/auth
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-neon/60">
            <span className="size-1 rounded-full bg-neon" />
            live
          </span>
        </div>

        <div className="px-4 py-3.5 font-mono text-[11px] leading-[1.9] sm:text-xs">
          <p>
            <span className="text-neon">$</span> <span className="text-white/85">whoami</span>
          </p>
          <p className="text-muted">
            guest_operator <span className="text-muted/70">// clearance: 0</span>
          </p>
          <p>
            <span className="text-neon">$</span> <span className="text-white/85">decryptme login --continue</span>
          </p>
          <p className="text-muted">
            <span className="text-neon/80">[ok]</span> secure channel established
          </p>
          <p className="flex items-center text-muted">
            awaiting credentials
            <span className="ml-2 inline-block h-3 w-[6px] animate-blink bg-neon/80" />
          </p>
        </div>
      </div>
    </section>
  )
}

function AuthCard({
  form,
  updateField,
  showPassword,
  setShowPassword,
  remember,
  setRemember,
  capsLock,
  handlePasswordKey,
  loading,
  status,
  handleSubmit,
  handleSso,
  handleRef,
  passwordRef,
  handleInvalid,
  passwordInvalid,
}) {
  return (
    <section aria-labelledby="login-heading" className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div aria-hidden="true" className="absolute -inset-8 rounded-[48px] bg-neon/[0.045] blur-3xl" />

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-px rounded-[26px] bg-gradient-to-b from-white/15 via-white/[0.04] to-transparent"
        />

        <div className="relative overflow-hidden rounded-[25px] border border-white/[0.06] bg-[#080e0b]/95 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden="true"
            className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-neon/80 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-52 rounded-full bg-neon/[0.07] blur-3xl"
          />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                <LockIcon className="size-3 text-neon" />
                Secure sign-in
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted/80">node 07</span>
            </div>

            <h2
              id="login-heading"
              className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[30px]"
            >
              Welcome back, operator.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign in to resume your challenges and keep your streak alive.
            </p>

            <div className="mt-5">
              <button type="button" onClick={() => handleSso('Google')} className={`${socialButtonClass} w-full`}>
                <GoogleIcon className="size-4 transition" />
                Continue with Google
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.07]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted/90">
                or use credentials
              </span>
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="handle" className="text-[12.5px] font-medium text-white/80">
                  Handle or email
                </label>
                <div className="group relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-white/30 transition group-focus-within:text-neon/80">
                    <UserIcon className="size-[17px]" />
                  </span>
                  <input
                    ref={handleRef}
                    id="handle"
                    name="handle"
                    type="text"
                    autoComplete="username"
                    spellCheck="false"
                    placeholder="r3v3rs3r"
                    value={form.handle}
                    onChange={updateField('handle')}
                    aria-invalid={handleInvalid}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-[12.5px] font-medium text-white/80">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[11.5px] font-medium text-neon/85 transition hover:text-neon-bright"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="group relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-white/30 transition group-focus-within:text-neon/80">
                    <LockIcon className="size-[17px]" />
                  </span>
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={updateField('password')}
                    onKeyDown={handlePasswordKey}
                    onKeyUp={handlePasswordKey}
                    onBlur={() => setCapsLock(false)}
                    aria-invalid={passwordInvalid}
                    aria-describedby={capsLock ? 'caps-lock-hint' : undefined}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/35 transition hover:text-white/70"
                  >
                    {showPassword ? <EyeOffIcon className="size-[17px]" /> : <EyeIcon className="size-[17px]" />}
                  </button>
                </div>

                {capsLock && (
                  <p id="caps-lock-hint" className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-300/80">
                    Caps Lock is on
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer select-none items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className="grid size-[18px] place-items-center rounded-[5px] border border-white/15 bg-white/[0.03] transition peer-checked:border-neon peer-checked:bg-neon peer-focus-visible:ring-2 peer-focus-visible:ring-neon/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#080e0b] [&_svg]:opacity-0 [&_svg]:transition-opacity peer-checked:[&_svg]:opacity-100"
                  >
                    <CheckIcon className="size-3 text-[#04120a]" />
                  </span>
                  <span className="text-[12.5px] text-muted">Keep me signed in</span>
                </label>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted/80">30 days</span>
              </div>

              <div aria-live="polite" className="mt-5 empty:mt-0">
                {status && (
                  <div
                    role={status.type === 'error' ? 'alert' : 'status'}
                    className={
                      status.type === 'error'
                        ? 'flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-red-200'
                        : 'flex items-start gap-2.5 rounded-lg border border-neon/20 bg-neon/[0.06] px-3 py-2.5 text-[11.5px] leading-relaxed text-neon/90'
                    }
                  >
                    {status.type === 'error' ? (
                      <AlertIcon className="mt-px size-3.5 shrink-0" />
                    ) : (
                      <InfoIcon className="mt-px size-3.5 shrink-0" />
                    )}
                    <p>{status.text}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-5 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-neon text-[14px] font-semibold text-[#04120a] transition hover:bg-neon-bright hover:shadow-[0_0_34px_-6px_rgba(115,247,109,0.65)] active:scale-[0.995] disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-[#04120a]/25 border-t-[#04120a]" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-muted">
              New to decryptme?{' '}
              <a
                href="#"
                className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon"
              >
                Create an operator account
              </a>
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted/90">
              <LockIcon className="size-3 text-neon/50" />
              TLS 1.3 · rate limited · audited
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 px-4 text-center text-[11px] leading-relaxed text-muted/90">
        By signing in you agree to the{' '}
        <a href="#" className="text-white/70 underline-offset-2 transition hover:text-neon hover:underline">
          rules of engagement
        </a>{' '}
        and{' '}
        <a href="#" className="text-white/70 underline-offset-2 transition hover:text-neon hover:underline">
          privacy policy
        </a>
        .
      </p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/90">
          © 2026 decryptme · authorized operators only
        </p>

        <nav aria-label="Footer" className="flex items-center gap-5 text-[11px] text-muted">
          <a href="#" className="transition hover:text-white">
            Rules
          </a>
          <a href="#" className="transition hover:text-white">
            Privacy
          </a>
          <a href="#" className="inline-flex items-center gap-1.5 transition hover:text-white">
            <span className="size-1 rounded-full bg-neon" />
            Status
          </a>
        </nav>
      </div>
    </footer>
  )
}

function UserIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14.5v2" />
    </svg>
  )
}

function EyeIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4l16 16" />
      <path d="M9.9 5.1A10.6 10.6 0 0 1 12 4.9c6 0 9.5 5.5 9.5 5.5a17.6 17.6 0 0 1-3.2 3.8" />
      <path d="M6.6 6.7A17 17 0 0 0 2.5 10.4S6 15.9 12 15.9a10 10 0 0 0 4.1-.85" />
      <path d="M10.4 10.4a2.75 2.75 0 0 0 3.2 3.2" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function AlertIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V13" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function InfoIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  )
}

export default Login
