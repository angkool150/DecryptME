// server/middleware/auth.js
// Protects routes — attach to any endpoint that requires login.
//
// Supabase stores administrators in the `users` table with role = 'admin'
// (there is no separate `admins` table), so every account is resolved from one
// place.

import jwt from 'jsonwebtoken'
import { serverError } from '../lib/errors.js'
import pool from '../db.js'

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated.' })
    }

    try {
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
        const id = decoded.id ?? decoded.userId
        const account = decoded.account || (decoded.role === 'admin' ? 'admin' : 'user')

        const [rows] = await pool.query(
            'SELECT id, username, role, is_active FROM users WHERE id = ?',
            [id]
        )

        const user = rows[0]
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Account is not active.' })
        }

        if (account === 'admin' && user.role !== 'admin') {
            return res.status(401).json({ error: 'Account is not active.' })
        }

        req.user = {
            ...decoded,
            account: user.role === 'admin' ? 'admin' : 'user',
            id: user.id,
            userId: user.id,
            username: user.username,
            role: user.role || 'user',
        }

        if (user.role === 'admin') {
            req.admin = { id: user.id, username: user.username, role: 'admin', is_active: true }
        }

        return next()
    } catch (err) {
        if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token invalid or expired.' })
        }
                return serverError(res, err, '[requireAuth]')
    }
}
