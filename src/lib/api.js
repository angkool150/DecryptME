'use client'

export class ApiError extends Error {
    constructor(message, status, payload = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.payload = payload
    }
}

export function getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
}

export function setSession(token, user) {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
}

export function clearSession() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
}

export function getStoredUser() {
    if (typeof window === 'undefined') return null
    try {
        return JSON.parse(localStorage.getItem('auth_user') || 'null')
    } catch {
        return null
    }
}

export function setStoredUser(patch) {
    if (typeof window === 'undefined') return
    try {
        const current = JSON.parse(localStorage.getItem('auth_user') || 'null') || {}
        localStorage.setItem('auth_user', JSON.stringify({ ...current, ...patch }))
    } catch {}
}

function parseJsonText(text, fallback) {
    try {
        return JSON.parse(text)
    } catch {
        return fallback
    }
}

export async function readJson(response, { fallback = { error: 'Unexpected server response.' } } = {}) {
    const text = await response.text()
    if (!text) return {}
    return parseJsonText(text, fallback)
}

export async function apiRequest(path, { method = 'GET', body, signal, errorMessage, includeServerError = true } = {}) {
    const token = getToken()
    const headers = { Accept: 'application/json' }

    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const response = await fetch(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
    })

    const text = await response.text()
    const payload = text ? parseJsonText(text, { error: text }) : null

    if (!response.ok) {
        const message = includeServerError
            ? payload?.error || errorMessage || `Request failed (${response.status}).`
            : errorMessage || `Request failed (${response.status}).`
        throw new ApiError(message, response.status, payload)
    }

    return payload
}
