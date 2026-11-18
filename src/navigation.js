'use client'

// Bridge to the Next.js App Router. A client component registers the router
// once (see src/components/NavigationBridge.jsx), then every existing
// navigate() call becomes an in-app client-side transition.
let routerRef = null

export function setRouter(router) {
    routerRef = router
}

export function navigate(href) {
    if (typeof window === 'undefined') return

    const url = new URL(href, window.location.origin)
    const samePath = url.pathname === window.location.pathname

    if (samePath && url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
        window.history.replaceState({}, '', `${url.pathname}${url.hash}`)
        return
    }

    if (samePath && !url.hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
    }

    const target = `${url.pathname}${url.search}${url.hash}`
    if (routerRef) {
        routerRef.push(target)
        return
    }

    window.location.assign(target)
}
