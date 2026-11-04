import { useEffect, useRef, useState } from 'react'
import { navigate } from '../navigation.js'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/' },
    { label: 'Challenges', href: '/challenges', count: 12 },
    { label: 'Leaderboard', href: '/leaderboard' },
]

const PROFILE_LINKS = [
    { label: 'Profile', hint: 'View operator card', href: '/profile', icon: UserIcon },
]

function Navbar({ activeItem = 'Dashboard' }) {
    const [active, setActive] = useState(activeItem)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const headerRef = useRef(null)
    const profileRef = useRef(null)
    const profileButtonRef = useRef(null)
    const mobileButtonRef = useRef(null)

    useEffect(() => {
        function handlePointerDown(event) {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                setMobileOpen(false)
                setProfileOpen(false)
                return
            }

            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false)
            }
        }

        function handleKeyDown(event) {
            if (event.key !== 'Escape') return

            if (profileOpen) {
                setProfileOpen(false)
                profileButtonRef.current?.focus()
            }

            if (mobileOpen) {
                setMobileOpen(false)
                mobileButtonRef.current?.focus()
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [mobileOpen, profileOpen])

    function selectNavItem(label) {
        setActive(label)
        setMobileOpen(false)
        setProfileOpen(false)
    }

    function toggleMobile() {
        setMobileOpen((current) => !current)
        setProfileOpen(false)
    }

    return (
        <header
            ref={headerRef}
            className="sticky top-0 z-50 border-b border-white/[0.07] bg-void/80 backdrop-blur-xl"
        >
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/35 to-transparent"
            />

            <div className="mx-auto flex h-[68px] w-full max-w-[1360px] items-center gap-4 px-5 sm:px-8 lg:h-[72px]">
                <a
                    href="/"
                    onClick={(event) => {
                        event.preventDefault()
                        selectNavItem('Dashboard')
                        navigate('/')
                    }}
                    className="group flex shrink-0 items-center gap-2.5 sm:gap-3"
                >
                    <img
                        src="/decryptme-logo.svg"
                        alt=""
                        className="h-8 w-auto drop-shadow-[0_0_14px_rgba(115,247,109,0.22)] transition-transform duration-300 group-hover:-rotate-3"
                    />
                    <span className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold tracking-[-0.02em] text-white sm:text-[17px]">
                            decryptme
                        </span>
                        <span className="hidden rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-neon sm:inline-block">
                            ctf
                        </span>
                    </span>
                </a>

                <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 lg:flex">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.label

                        return (
                            <a
                                key={item.label}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={(event) => {
                                    event.preventDefault()
                                    selectNavItem(item.label)
                                    navigate(item.href)
                                }}
                                className={`relative flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition ${isActive
                                    ? 'bg-neon/[0.08] text-neon'
                                    : 'text-muted hover:bg-white/[0.04] hover:text-white'
                                    }`}
                            >
                                {item.label}
                                {item.count ? (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] leading-none ${isActive ? 'bg-neon/15 text-neon' : 'bg-white/[0.05] text-muted'
                                            }`}
                                    >
                                        {item.count}
                                    </span>
                                ) : null}
                            </a>
                        )
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
                    <span className="mr-1 hidden items-center gap-2 xl:flex">


                    </span>

                    <button
                        type="button"
                        aria-label="Notifications"
                        className="relative hidden size-9 place-items-center rounded-lg border border-transparent text-muted transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white sm:grid"
                    >
                        <BellIcon className="size-[18px]" />
                        <span
                            aria-hidden="true"
                            className="absolute right-2 top-2 size-1.5 rounded-full bg-neon ring-2 ring-[#050806]"
                        />
                    </button>

                    <span aria-hidden="true" className="hidden h-6 w-px bg-white/[0.08] sm:block" />

                    <div ref={profileRef} className="relative">
                        <button
                            ref={profileButtonRef}
                            type="button"
                            aria-expanded={profileOpen}
                            aria-controls="profile-menu"
                            onClick={() => {
                                setProfileOpen((current) => !current)
                                setMobileOpen(false)
                            }}
                            className={`flex h-10 items-center gap-2.5 rounded-full border pl-1 pr-2 transition sm:pr-3 ${profileOpen
                                ? 'border-neon/30 bg-white/[0.06]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                                }`}
                        >
                            <Avatar />
                            <span className="hidden text-left sm:block">
                                <span className="block text-[12px] font-medium leading-tight text-white">Profile</span>
                                <span className="block font-mono text-[9px] leading-tight text-muted">r3v3rs3r</span>
                            </span>
                            <ChevronDownIcon
                                className={`size-3.5 text-muted transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''
                                    }`}
                            />
                            <span className="sr-only">Open profile menu</span>
                        </button>

                        {profileOpen ? (
                            <div
                                id="profile-menu"
                                className="animate-nav-in absolute -right-11 top-[calc(100%+14px)] w-[288px] overflow-hidden rounded-2xl border border-white/10 bg-[#070d0a]/95 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:right-0 lg:top-[calc(100%+16px)]"
                            >
                                <div className="border-b border-white/[0.07] bg-white/[0.02] p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar size="lg" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">r3v3rs3r</p>
                                            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                                                Rank #128 · 4,820 pts
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-1.5">
                                    {PROFILE_LINKS.map((link) => (
                                        <ProfileLink
                                            key={link.label}
                                            {...link}
                                            onSelect={() => setProfileOpen(false)}
                                        />
                                    ))}
                                </div>

                                <div className="border-t border-white/[0.07] p-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-red-300/90 transition hover:bg-red-400/[0.07] hover:text-red-200"
                                    >
                                        <LogOutIcon className="size-4" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        ref={mobileButtonRef}
                        type="button"
                        onClick={toggleMobile}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-navigation"
                        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white lg:hidden"
                    >
                        {mobileOpen ? <CloseIcon className="size-[18px]" /> : <MenuIcon className="size-[18px]" />}
                    </button>
                </div>
            </div>

            {mobileOpen ? (
                <div
                    id="mobile-navigation"
                    className="animate-nav-in absolute inset-x-0 top-full border-t border-white/[0.06] bg-[#060b08]/95 backdrop-blur-xl lg:hidden"
                >
                    <nav aria-label="Mobile navigation" className="mx-auto w-full max-w-[1360px] px-5 py-3 sm:px-8">
                        <div className="space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = active === item.label

                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        onClick={(event) => {
                                            event.preventDefault()
                                            selectNavItem(item.label)
                                            navigate(item.href)
                                        }}
                                        className={`flex h-11 items-center gap-2 rounded-xl px-3 text-[13.5px] font-medium transition ${isActive
                                            ? 'bg-neon/[0.08] text-neon'
                                            : 'text-muted hover:bg-white/[0.04] hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                        {item.count ? (
                                            <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] leading-none text-muted">
                                                {item.count}
                                            </span>
                                        ) : null}
                                        <ArrowUpRightIcon className="ml-auto size-4 opacity-40" />
                                    </a>
                                )
                            })}
                        </div>

                        <div className="mt-2 border-t border-white/[0.06] pt-2">
                            <a
                                href="/profile"
                                onClick={(event) => {
                                    event.preventDefault()
                                    setMobileOpen(false)
                                    navigate('/profile')
                                }}
                                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
                            >
                                <Avatar />
                                <span className="min-w-0">
                                    <span className="block text-[13px] font-medium text-white">Profile</span>
                                    <span className="block truncate font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                                        r3v3rs3r · rank #128
                                    </span>
                                </span>
                                <ArrowUpRightIcon className="ml-auto size-4 text-muted/60" />
                            </a>
                        </div>
                    </nav>
                </div>
            ) : null}
        </header>
    )
}

function ProfileLink({ href, icon: Icon, label, hint, onSelect }) {
    return (
        <a
            href={href}
            onClick={(event) => {
                event.preventDefault()
                onSelect()
                if (href.startsWith('/')) navigate(href)
            }}
            className="group/link flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-white/[0.05]"
        >
            <span className="grid size-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-muted transition group-hover/link:border-neon/20 group-hover/link:text-neon">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-white/85 transition group-hover/link:text-white">
                    {label}
                </span>
                <span className="block truncate font-mono text-[9px] text-muted/80">{hint}</span>
            </span>
        </a>
    )
}

function Avatar({ size = 'sm' }) {
    return (
        <span
            aria-hidden="true"
            className={`relative grid shrink-0 place-items-center rounded-full border border-neon/25 bg-[#0d1a11] font-mono font-semibold text-neon shadow-[inset_0_0_14px_rgba(115,247,109,0.1)] ${size === 'lg' ? 'size-10 text-[11px]' : 'size-8 text-[10px]'
                }`}
        >
            RK
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#050806] bg-neon" />
        </span>
    )
}

function BellIcon({ className }) {
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
            <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8" />
            <path d="M13.8 20a2 2 0 0 1-3.6 0" />
        </svg>
    )
}

function ChevronDownIcon({ className }) {
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
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function MenuIcon({ className }) {
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
            <path d="M4 7h16" />
            <path d="M4 12h11" />
            <path d="M4 17h16" />
        </svg>
    )
}

function CloseIcon({ className }) {
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
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
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



function LogOutIcon({ className }) {
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    )
}

function ArrowUpRightIcon({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
        </svg>
    )
}

export default Navbar
