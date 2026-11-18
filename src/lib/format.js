// Shared display formatting helpers.

export function initials(name = '') {
    return String(name).slice(0, 2).toUpperCase() || 'OP'
}

export function formatNumber(value, locale) {
    return value.toLocaleString(locale)
}
