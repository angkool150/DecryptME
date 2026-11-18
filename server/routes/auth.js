// server/routes/auth.js
// POST /api/auth/login            — validates credentials, returns JWT
// POST /api/auth/register         — reserves account (inactive) + stores bcrypt hash; client triggers Supabase verification email
// POST /api/auth/sync             — verifies Supabase access token, activates/links public.users, returns JWT
// POST /api/auth/reset-password   — verifies recovery access token and sets bcrypt hash in public.users
// POST /api/auth/logout           — clears presence
// GET  /api/auth/stats            — public stats
//
// Security: all DB access is parameterized, inputs are validated/length-limited,
// errors are generic where appropriate, and rate limiting is applied to auth actions.

import { Router } from 'express'
import { serverError } from '../lib/errors.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { loginRateLimiter, authActionRateLimiter, resetLoginRateLimit } from '../middleware/rateLimit.js'
import { writeAudit } from '../lib/audit.js'
import { getSupabaseAdmin, getSupabaseUserFromAccessToken, isSupabaseAdminConfigured } from '../lib/supabase-admin.js'
import {
    asTrimmedString,
    validateEmail,
    validateLoginIdentifier,
    validatePassword,
    validateUsername,
} from '../lib/validate.js'

const router = Router()

function signAppToken(user) {
    return jwt.sign(
        { account: 'user', id: user.id, userId: user.id, username: user.username, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

function publicUserPayload(user) {
    return {
        account: 'user',
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        total_points: Number(user.total_points || 0),
        solved_count: Number(user.solved_count || 0),
    }
}

function isUsablePasswordHash(hash) {
    return typeof hash === 'string' && hash.startsWith('$2')
}

async function findUserByIdentifier(identifier) {
    const [rows] = await pool.query(
        `SELECT id, username, email, password_hash, role, total_points, solved_count, is_active
         FROM users
         WHERE lower(username) = lower(?) OR lower(email) = lower(?)
         LIMIT 1`,
        [identifier, identifier]
    )
    return rows[0] || null
}

async function findUserByEmail(email) {
    const [rows] = await pool.query(
        `SELECT id, username, email, password_hash, role, total_points, solved_count, is_active
         FROM users WHERE lower(email) = lower(?) LIMIT 1`,
        [email]
    )
    return rows[0] || null
}

function sanitizeUsername(base) {
    const cleaned = String(base || '')
        .replace(/[^a-zA-Z0-9_.-]/g, '_')
        .replace(/^[^a-zA-Z0-9]+/, '')
        .slice(0, 32)
    if (cleaned.length >= 3) return cleaned
    return `operator_${crypto.randomBytes(3).toString('hex')}`
}

async function uniqueUsername(preferred) {
    let candidate = sanitizeUsername(preferred)
    for (let i = 0; i < 12; i += 1) {
        const [rows] = await pool.query('SELECT 1 FROM users WHERE lower(username) = lower(?) LIMIT 1', [candidate])
        if (!rows.length) return candidate
        candidate = `${sanitizeUsername(preferred).slice(0, 24)}_${crypto.randomBytes(2).toString('hex')}`
    }
    return `operator_${crypto.randomBytes(4).toString('hex')}`
}

async function upsertPresenceLogin(userId) {
    await pool.query(
        `INSERT INTO user_presence
            (user_id, last_heartbeat_at, current_activity, current_path, last_login_at)
         VALUES (?, NOW(), ?, ?, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
            last_heartbeat_at = NOW(),
            current_activity = EXCLUDED.current_activity,
            current_path = EXCLUDED.current_path,
            last_login_at = NOW()`,
        [userId, 'Signing in', '/login']
    )
}

router.get('/stats', async (_req, res) => {
    try {
        const [[{ count: operators }]] = await pool.query(
            'SELECT COUNT(*) AS count FROM users WHERE is_active = TRUE'
        )
        const [[{ count: challenges }]] = await pool.query(
            'SELECT COUNT(*) AS count FROM challenges WHERE is_active = TRUE'
        )
        const [[{ count: solvedChallenges }]] = await pool.query(
            'SELECT COUNT(DISTINCT challenge_id) AS count FROM solves'
        )
        const [[{ count: flagsCaptured }]] = await pool.query(
            'SELECT COUNT(*) AS count FROM solves'
        )

        return res.json({
            operators: Number(operators || 0),
            challenges: Number(challenges || 0),
            solvedChallenges: Number(solvedChallenges || 0),
            flagsCaptured: Number(flagsCaptured || 0),
        })
    } catch (err) {
                return serverError(res, err, '[auth/stats]')
    }
})

router.post('/login', loginRateLimiter, async (req, res) => {
    const idResult = validateLoginIdentifier(req.body?.username ?? req.body?.identifier)
    const pwResult = validatePassword(req.body?.password)
    if (idResult.error || pwResult.error) {
        return res.status(401).json({ error: 'Invalid username or password.' })
    }

    try {
        const user = await findUserByIdentifier(idResult.value)
        if (!user) return res.status(401).json({ error: 'Invalid username or password.' })
        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is not active. Verify your email to continue.' })
        }

        let passwordMatch = false
        if (isUsablePasswordHash(user.password_hash)) {
            passwordMatch = await bcrypt.compare(pwResult.value, user.password_hash)
        }

        // Bridge: if the local hash is unusable (e.g. OAuth-created row) or missing sync,
        // verify via Supabase Auth and persist a local bcrypt hash for future logins.
        if (!passwordMatch && isSupabaseAdminConfigured()) {
            const admin = getSupabaseAdmin()
            const { error } = await admin.auth.signInWithPassword({
                email: user.email,
                password: pwResult.value,
            })
            if (!error) {
                passwordMatch = true
                const hash = await bcrypt.hash(pwResult.value, 12)
                await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id])
            }
        }

        if (!passwordMatch) return res.status(401).json({ error: 'Invalid username or password.' })

        resetLoginRateLimit(req)

        await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [user.id])
        await upsertPresenceLogin(user.id)

        if (user.role === 'admin') {
            await writeAudit(req, {
                actorUserId: user.id,
                action: 'admin.login',
                entityType: 'user',
                entityId: user.id,
                details: { username: user.username },
            })
        }

        return res.json({ token: signAppToken(user), user: publicUserPayload(user) })
    } catch (err) {
                return serverError(res, err, '[auth/login]')
    }
})

router.post('/register', authActionRateLimiter, async (req, res) => {
    const usernameResult = validateUsername(req.body?.username)
    const emailResult = validateEmail(req.body?.email)
    const passwordResult = validatePassword(req.body?.password)
    if (usernameResult.error) return res.status(400).json({ error: usernameResult.error })
    if (emailResult.error) return res.status(400).json({ error: emailResult.error })
    if (passwordResult.error) return res.status(400).json({ error: passwordResult.error })

    try {
        const username = usernameResult.value
        const email = emailResult.value
        const passwordHash = await bcrypt.hash(passwordResult.value, 12)

        const [existing] = await pool.query(
            `SELECT id, username, email, is_active
             FROM users
             WHERE lower(username) = lower(?) OR lower(email) = lower(?)
             LIMIT 1`,
            [username, email]
        )

        if (existing[0]) {
            const row = existing[0]
            const sameUser = row.username?.toLowerCase() === username.toLowerCase() && row.email?.toLowerCase() === email
            if (sameUser && !row.is_active) {
                // Pending verification: refresh the password hash and let the client
                // re-trigger the Supabase verification email.
                await pool.query('UPDATE users SET password_hash = ?, username = ? WHERE id = ?', [
                    passwordHash,
                    username,
                    row.id,
                ])
                return res.json({ ok: true, pending: true, message: 'Check your email to verify your account.' })
            }
            return res.status(409).json({ error: 'Username or email is already in use.' })
        }

        await pool.query(
            `INSERT INTO users (username, email, password_hash, role, is_active)
             VALUES (?, ?, ?, 'user', FALSE)`,
            [username, email, passwordHash]
        )

        return res.status(201).json({ ok: true, pending: true, message: 'Check your email to verify your account.' })
    } catch (err) {
        if (err?.code === '23505') return res.status(409).json({ error: 'Username or email is already in use.' })
                return serverError(res, err, '[auth/register]')
    }
})

// Verifies a Supabase session (email confirmation, OAuth, or recovery) and
// bridges it to a local app user + custom JWT.
router.post('/sync', authActionRateLimiter, async (req, res) => {
    const accessToken = asTrimmedString(req.body?.accessToken, 4096)
    if (!accessToken) return res.status(400).json({ error: 'Missing session.' })

    const { user: sbUser, error } = await getSupabaseUserFromAccessToken(accessToken)
    if (error || !sbUser?.email) return res.status(401).json({ error: 'Invalid or expired session.' })

    try {
        const email = String(sbUser.email).toLowerCase()
        const provider = sbUser.app_metadata?.provider || 'email'
        const metaUsername = asTrimmedString(sbUser.user_metadata?.username, 32)
        const metaName = asTrimmedString(sbUser.user_metadata?.full_name || sbUser.user_metadata?.name, 80)
        const password = typeof req.body?.password === 'string' ? req.body.password : ''

        let user = await findUserByEmail(email)

        if (!user) {
            const username = await uniqueUsername(metaUsername || metaName || email.split('@')[0])
            const hash = password
                ? await bcrypt.hash(password.slice(0, 128), 12)
                : `!${provider}-oauth`
            const [inserted] = await pool.query(
                `INSERT INTO users (username, email, password_hash, role, is_active)
                 VALUES (?, ?, ?, 'user', TRUE)
                 RETURNING id, username, email, password_hash, role, total_points, solved_count, is_active`,
                [username, email, hash]
            )
            user = inserted[0]
        } else {
            // Activate after email verification and, if provided, set a usable local password hash.
            if (!user.is_active || (password && !isUsablePasswordHash(user.password_hash))) {
                const nextHash = password ? await bcrypt.hash(password.slice(0, 128), 12) : user.password_hash
                await pool.query('UPDATE users SET is_active = TRUE, password_hash = ? WHERE id = ?', [nextHash, user.id])
                user.is_active = true
                user.password_hash = nextHash
            }
        }

        await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [user.id])
        await upsertPresenceLogin(user.id)

        return res.json({ token: signAppToken(user), user: publicUserPayload(user) })
    } catch (err) {
        if (err?.code === '23505') return res.status(409).json({ error: 'Could not create account. Try a different username.' })
                return serverError(res, err, '[auth/sync]')
    }
})

// Sets the local bcrypt password after a Supabase recovery session.
router.post('/reset-password', authActionRateLimiter, async (req, res) => {
    const accessToken = asTrimmedString(req.body?.accessToken, 4096)
    const passwordResult = validatePassword(req.body?.password)
    if (!accessToken) return res.status(400).json({ error: 'Missing recovery session.' })
    if (passwordResult.error) return res.status(400).json({ error: passwordResult.error })

    const { user: sbUser, error } = await getSupabaseUserFromAccessToken(accessToken)
    if (error || !sbUser?.email) return res.status(401).json({ error: 'Invalid or expired recovery session.' })

    try {
        const email = String(sbUser.email).toLowerCase()
        const hash = await bcrypt.hash(passwordResult.value, 12)
        const [result] = await pool.query(
            'UPDATE users SET password_hash = ?, is_active = TRUE WHERE lower(email) = lower(?)',
            [hash, email]
        )

        if (!result.affectedRows) {
            // User authenticated via Supabase but has no local row (edge case).
            const username = await uniqueUsername(email.split('@')[0])
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, is_active)
                 VALUES (?, ?, ?, 'user', TRUE)`,
                [username, email, hash]
            )
        }

        return res.json({ ok: true, message: 'Password updated. You can sign in now.' })
    } catch (err) {
                return serverError(res, err, '[auth/reset-password]')
    }
})

router.post('/logout', requireAuth, async (req, res) => {
    try {
        const id = req.user.id ?? req.user.userId
        const isAdmin = req.user.account === 'admin' || req.user.role === 'admin'

        if (isAdmin) {
            await pool.query(
                `UPDATE user_presence
                 SET last_heartbeat_at = NULL, current_activity = NULL, current_path = NULL
                 WHERE user_id = ?`,
                [id]
            )
            await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [id])

            await writeAudit(req, {
                actorUserId: id,
                action: 'admin.logout',
                entityType: 'user',
                entityId: id,
                details: { username: req.user.username },
            })
            return res.json({ ok: true })
        }

        await pool.query(
            `UPDATE user_presence
             SET last_heartbeat_at = NULL, current_activity = NULL, current_path = NULL
             WHERE user_id = ?`,
            [id]
        )
        await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [id])

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[auth/logout]')
    }
})

export default router
