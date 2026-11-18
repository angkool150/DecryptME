import './globals.css'
import NavigationBridge from '@/src/components/NavigationBridge.jsx'

export const metadata = {
    title: 'decryptme — CTF platform',
    description: 'DecryptMe is a CTF arena for hackers, builders, and problem-solvers.',
    icons: {
        icon: '/decryptme-logo.svg',
    },
}

export const viewport = {
    themeColor: '#050806',
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                {children}
                <NavigationBridge />
            </body>
        </html>
    )
}
