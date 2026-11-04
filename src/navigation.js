export function navigate(href) {
    const url = new URL(href, window.location.origin)
    const pathChanged = url.pathname !== window.location.pathname

    if (pathChanged) {
        window.history.pushState({}, '', `${url.pathname}${url.hash}`)
        window.dispatchEvent(new PopStateEvent('popstate'))
        return
    }

    if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
        return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
}
