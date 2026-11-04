import Navbar from './Navbar.jsx'

function AppLayout({ activeItem, children }) {
    return (
        <div className="relative flex min-h-svh flex-col bg-void">
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

            <Navbar key={activeItem} activeItem={activeItem} />

            {children}
        </div>
    )
}

export default AppLayout
