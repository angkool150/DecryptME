// Replace this with the real contact address before publishing.
const CONTACT_EMAIL = 'privacy@example.com'

export const metadata = {
    title: 'Privacy policy · decryptme',
    description: 'How DecryptMe collects, uses, and protects your information.',
}

export default function PrivacyPage() {
    return (
        <div className="relative flex min-h-svh flex-col overflow-hidden bg-void">
            <Backdrop />

            <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-1 flex-col px-5 sm:px-8">
                <Header />

                <main className="flex flex-1 flex-col py-10 sm:py-14">
                    <div className="mx-auto w-full max-w-[920px]">
                        <div className="relative">
                            <div aria-hidden="true" className="absolute -inset-8 rounded-[48px] bg-neon/[0.035] blur-3xl" />
                            <div className="relative overflow-hidden rounded-[25px] border border-white/[0.06] bg-[#080e0b]/95 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-10">
                                <div aria-hidden="true" className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-neon/80 to-transparent" />

                                <div className="relative">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                                        <span className="size-1.5 rounded-full bg-neon" />
                                        Operator documentation
                                    </div>

                                    <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[42px]">
                                        Privacy <span className="glow-text text-neon">policy</span>
                                    </h1>
                                    <p className="mt-3 text-sm leading-relaxed text-muted">
                                        Last updated: 21 November 2026. This policy explains what information DecryptMe
                                        handles when you create an account, solve challenges, and use the platform.
                                    </p>

                                    <div className="mt-8 space-y-9">
                                        <Section title="1. Who we are">
                                            <p>
                                                DecryptMe is a capture-the-flag platform hosted on Vercel. This policy
                                                applies to the website, its API, and the account and scoring systems that
                                                support it. It does not cover third-party services you choose to sign in
                                                with, such as Google.
                                            </p>
                                        </Section>

                                        <Section title="2. Information we collect">
                                            <p>We collect only the information needed to run the platform:</p>
                                            <ul>
                                                <li><strong>Account details:</strong> username, email address, a bcrypt hash of your password, account role and status, and profile fields such as bio, avatar, country, and time zone.</li>
                                                <li><strong>Session data:</strong> a JSON Web Token and a small cached profile object stored in your browser&apos;s <code>localStorage</code>. Supabase may also keep your authentication session in browser storage.</li>
                                                <li><strong>Challenge activity:</strong> flag submissions, solves, points, attempts, and rankings shown on the leaderboard. Submitted flags are stored as one-way hashes, not as readable text.</li>
                                                <li><strong>Presence and activity:</strong> your last seen time, last login time, and — while you are signed in — the page you are viewing and a general activity label, so the platform can show online operators.</li>
                                                <li><strong>Security records:</strong> a hashed IP address and user agent associated with sign-ins, flag attempts, and administrative actions. We use these for rate limiting and abuse investigations.</li>
                                                <li><strong>Files:</strong> challenge attachments and profile images you upload, which are stored in Supabase Storage and delivered through short-lived signed links.</li>
                                            </ul>
                                        </Section>

                                        <Section title="3. How we use your information">
                                            <p>We use this information to:</p>
                                            <ul>
                                                <li>create and authenticate your account, including email verification and password reset;</li>
                                                <li>score submissions, maintain the leaderboard, and track your progress;</li>
                                                <li>show which operators are currently online;</li>
                                                <li>protect the platform with rate limits, audit logs, and hashed security records;</li>
                                                <li>serve the challenge files and profile pictures you upload.</li>
                                            </ul>
                                            <p>We do not sell your information, and we do not use it for advertising.</p>
                                        </Section>

                                        <Section title="4. Who we share it with">
                                            <p>
                                                We use a small number of service providers to operate DecryptMe:
                                            </p>
                                            <ul>
                                                <li><strong>Supabase</strong> provides authentication, the PostgreSQL database, and private file storage.</li>
                                                <li><strong>Vercel</strong> hosts the website and API.</li>
                                                <li><strong>Google</strong> is involved only if you choose &ldquo;Continue with Google&rdquo;. The site also loads fonts from Google Fonts, which receives a standard browser request when the page loads.</li>
                                                <li><strong>Supabase&apos;s email service</strong> sends verification and password-reset messages to the address you provide.</li>
                                            </ul>
                                            <p>
                                                These providers process data on our behalf under their own terms. We do not
                                                disclose your personal information to other parties except when required by law.
                                            </p>
                                        </Section>

                                        <Section title="5. Cookies and browser storage">
                                            <p>
                                                DecryptMe does not use advertising or analytics cookies. We use browser
                                                <code> localStorage</code> to keep you signed in and to remember your cached
                                                profile. Supabase may store session tokens in browser storage as well. You
                                                can clear this data at any time by signing out or clearing site data in
                                                your browser; doing so will sign you out.
                                            </p>
                                        </Section>

                                        <Section title="6. How long we keep data">
                                            <p>
                                                Account, profile, and scoring data are kept while your account is active.
                                                Security records such as hashed IPs, user agents, and audit entries are kept
                                                so we can investigate abuse and protect the platform. If you want your
                                                account and related data removed, contact us using the address below.
                                            </p>
                                        </Section>

                                        <Section title="7. Your choices and rights">
                                            <p>
                                                You can update your profile details from the Profile page, sign out to
                                                remove your local session, and choose whether to use Google sign-in.
                                                Depending on where you live, you may have rights to access, correct, or
                                                request deletion of your personal data. Send those requests to the
                                                contact address below.
                                            </p>
                                        </Section>

                                        <Section title="8. Security">
                                            <p>
                                                The site is served over HTTPS. Passwords are stored as bcrypt hashes,
                                                challenge flags are stored as SHA-256 hashes, database access uses
                                                parameterized queries, and secret keys stay on the server. No system is
                                                completely secure, but we aim to limit what is stored and exposed.
                                            </p>
                                        </Section>

                                        <Section title="9. Children">
                                            <p>
                                                DecryptMe is intended for an audience of at least 13 years of age. We do
                                                not knowingly collect information from younger children. If you believe
                                                a child has created an account, please contact us.
                                            </p>
                                        </Section>

                                        <Section title="10. Changes to this policy">
                                            <p>
                                                We may update this policy as the platform changes. Updates will be posted
                                                on this page with a new &ldquo;last updated&rdquo; date.
                                            </p>
                                        </Section>

                                        <Section title="11. Contact">
                                            <p>
                                                Questions or requests about your data can be sent to{' '}
                                                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">
                                                    {CONTACT_EMAIL}
                                                </a>
                                                .
                                            </p>
                                        </Section>
                                    </div>

                                    <div className="mt-10 border-t border-white/[0.06] pt-5 text-center text-[13px] text-muted">
                                        <a href="/login" className="font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon">
                                            Back to sign in
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    )
}

function Section({ title, children }) {
    return (
        <section className="border-t border-white/[0.06] pt-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-neon">{title}</h2>
            <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-muted [&_strong]:font-medium [&_strong]:text-white/85 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_code]:rounded [&_code]:bg-white/[0.05] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-white/80">
                {children}
            </div>
        </section>
    )
}

function Backdrop() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="auth-backdrop absolute inset-0" />
            <div className="bg-grid grid-fade absolute inset-0 opacity-50" />
            <img
                src="/favicon.svg"
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
            <a href="/login" className="group flex items-center gap-3">
                <img src="/favicon.svg" alt="" className="h-9 w-auto drop-shadow-[0_0_16px_rgba(115,247,109,0.22)] transition-transform duration-300 group-hover:-rotate-3" />
                <span className="flex items-center gap-2">
                    <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">decryptme</span>
                    <span className="rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-neon">ctf</span>
                </span>
            </a>
            <a href="/login" className="text-[13px] font-medium text-muted transition hover:text-white">Sign in</a>
        </header>
    )
}

function Footer() {
    return (
        <footer className="border-t border-white/[0.06] py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted/90">
                © 2026 decryptme · authorized operators only
            </p>
        </footer>
    )
}
