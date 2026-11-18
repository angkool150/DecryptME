// server/middleware/rateLimit.js
// In-memory rate limiters keyed by IP (+ optional identifier).
// For a single Node process this is sufficient. If the platform is
// deployed behind multiple processes, replace the store with Redis.

const WINDOW_MS = Number(process.env.AUTH_RATE_WINDOW_MS) || 15 * 60 * 1000
const MAX_ATTEMPTS = Number(process.env.AUTH_RATE_MAX) || 10

const attempts = new Map()

function limiterKey(req, identifier = '') {
    const value = String(identifier || req.body?.username || req.body?.email || '').trim().toLowerCase().slice(0, 254)
    return `${req.ip || 'unknown'}|${value}`
}

function consume(req, res, identifier) {
    const now = Date.now()
    const key = limiterKey(req, identifier)
    const current = attempts.get(key)

    if (!current || current.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }

    if (current.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
        res.set('Retry-After', String(retryAfter))
        res.status(429).json({
            error: `Too many attempts. Try again in ${retryAfter} seconds.`,
            retryAfter,
        })
        return false
    }

    current.count += 1
    return true
}

export function loginRateLimiter(req, res, next) {
    if (!consume(req, res, req.body?.username || req.body?.email)) return
    return next()
}

export function authActionRateLimiter(req, res, next) {
    if (!consume(req, res, req.body?.email || req.body?.username)) return
    return next()
}

export function resetLoginRateLimit(req) {
    attempts.delete(limiterKey(req, req.body?.username || req.body?.email))
}

// Periodically remove expired entries so the map does not grow forever.
const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of attempts) {
        if (entry.resetAt <= now) attempts.delete(key)
    }
}, 5 * 60 * 1000)

if (typeof cleanup.unref === 'function') cleanup.unref()
