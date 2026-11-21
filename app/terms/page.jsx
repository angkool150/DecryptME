const CONTACT_EMAIL = 'decryptMe@gmail.com'

export const metadata = {
    title: 'Terms of service · decryptme',
    description: 'The rules and terms that apply when you use the DecryptMe CTF platform.',
}

export default function TermsPage() {
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
                                        Platform rules
                                    </div>

                                    <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[42px]">
                                        Terms of <span className="glow-text text-neon">service</span>
                                    </h1>
                                    <p className="mt-3 text-sm leading-relaxed text-muted">
                                        Last updated: 21 November 2026. These terms govern your use of DecryptMe,
                                        including the challenges, leaderboard, accounts, and uploaded content.
                                    </p>

                                    <div className="mt-8 space-y-9">
                                        <Section title="1. Acceptance of terms">
                                            <p>
                                                By creating an account or using DecryptMe, you agree to these terms and
                                                to our <a href="/privacy" className={linkClass}>privacy policy</a>. If you
                                                do not agree, do not use the platform.
                                            </p>
                                        </Section>

                                        <Section title="2. Eligibility">
                                            <p>
                                                DecryptMe is intended for users aged 13 or older and is labeled for
                                                authorized operators only. You must provide accurate account information
                                                and comply with any rules posted for individual challenges or events.
                                            </p>
                                        </Section>

                                        <Section title="3. Your account">
                                            <p>
                                                You are responsible for keeping your username, email address, and
                                                password secure, and for all activity that happens under your account.
                                                Use one account per person, do not share your credentials, and contact
                                                us if you believe someone else has accessed your account. Password
                                                resets are sent to the email address on your account.
                                            </p>
                                        </Section>

                                        <Section title="4. Acceptable use">
                                            <p>You agree not to:</p>
                                            <ul>
                                                <li>share flags, solutions, or write-ups before an event ends, or use material that gives you an unfair advantage;</li>
                                                <li>attack, probe, overload, or attempt to gain unauthorized access to the platform, its hosting, or other users&apos; accounts;</li>
                                                <li>bypass rate limits or security controls with automated scripts or bots;</li>
                                                <li>impersonate other users, submit someone else&apos;s work as your own, or manipulate rankings;</li>
                                                <li>harass other participants, or upload unlawful, threatening, or abusive content.</li>
                                            </ul>
                                        </Section>

                                        <Section title="5. Challenges and scoring">
                                            <p>
                                                Challenge submissions are recorded and scored by the platform. Flags are
                                                stored as one-way hashes, and attempts are rate-limited to protect the
                                                service. Points and leaderboard positions are calculated automatically
                                                and may change if a challenge is corrected or an account is found to be
                                                in violation of these terms. Challenge rules and administrative decisions
                                                are final. Unless explicitly stated, no prizes or rewards are promised.
                                            </p>
                                        </Section>

                                        <Section title="6. Content you upload">
                                            <p>
                                                You may upload a profile picture and, where allowed, challenge-related
                                                files. You keep ownership of that content, but grant us a license to
                                                store, display, and serve it as part of the platform. You confirm that
                                                you have the right to upload it. We may remove content that breaks these
                                                terms or puts the service at risk.
                                            </p>
                                        </Section>

                                        <Section title="7. Third-party services">
                                            <p>
                                                DecryptMe relies on Supabase for authentication, the database, and file
                                                storage, Vercel for hosting, and Google Fonts for typography. If you sign
                                                in with Google, Google&apos;s terms apply to that sign-in. We are not
                                                responsible for the content or practices of those independent services.
                                            </p>
                                        </Section>

                                        <Section title="8. Availability and changes to the service">
                                            <p>
                                                The platform is provided as-is. We do not guarantee uninterrupted or
                                                error-free access, and we may perform maintenance, change features, or
                                                discontinue part or all of the service. We will try to give notice of
                                                significant changes where practical.
                                            </p>
                                        </Section>

                                        <Section title="9. Suspension and termination">
                                            <p>
                                                We may suspend or terminate an account if these terms are broken, if a
                                                security issue requires it, or if required by law. You may stop using the
                                                service at any time and can ask us to delete your account using the
                                                contact address below. Provisions that by their nature should survive
                                                termination will continue to apply.
                                            </p>
                                        </Section>

                                        <Section title="10. Intellectual property">
                                            <p>
                                                The DecryptMe name, design, challenges, and other platform content belong
                                                to the operator and are protected by applicable law. You may use the
                                                platform for its intended purpose, but you may not copy, sell, or
                                                redistribute its content without permission. Your profile content remains
                                                yours, subject to the license in section 6.
                                            </p>
                                        </Section>

                                        <Section title="11. Disclaimer and liability">
                                            <p>
                                                To the maximum extent permitted by law, DecryptMe is provided without
                                                warranties, and we are not liable for indirect or consequential losses
                                                arising from your use of the platform. Nothing in these terms removes
                                                any rights or protections that cannot lawfully be waived.
                                            </p>
                                        </Section>

                                        <Section title="12. Changes to these terms">
                                            <p>
                                                We may update these terms as the platform changes. The updated version
                                                will be posted on this page with a new &ldquo;last updated&rdquo; date,
                                                and continued use of DecryptMe means you accept the updated terms.
                                            </p>
                                        </Section>

                                        <Section title="13. Contact">
                                            <p>
                                                Questions about these terms can be sent to{' '}
                                                <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                                                    {CONTACT_EMAIL}
                                                </a>
                                                .
                                            </p>
                                        </Section>
                                    </div>

                                    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-5 text-center text-[13px] text-muted">
                                        <a href="/privacy" className={linkClass}>Privacy policy</a>
                                        <span aria-hidden="true" className="text-white/20">·</span>
                                        <a href="/login" className={linkClass}>Back to sign in</a>
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

const linkClass =
    'font-medium text-white underline decoration-neon/40 decoration-2 underline-offset-4 transition hover:text-neon'

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
            <a href="/login" className="group flex items-center gap-3">
                <img src="/decryptme-logo.svg" alt="" className="h-9 w-auto drop-shadow-[0_0_16px_rgba(115,247,109,0.22)] transition-transform duration-300 group-hover:-rotate-3" />
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
