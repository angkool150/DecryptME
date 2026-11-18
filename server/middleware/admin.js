// server/middleware/admin.js
// Verifies the JWT and confirms the account is an active administrator.

import jwt from 'jsonwebtoken'
import { serverError } from '../lib/errors.js'
import pool from '../db.js'

export async function requireAdmin(req, res, next) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated.' })
    }

    try {
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
        const id = decoded.id ?? decoded.userId

        const [rows] = await pool.query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
            [id]
        )

        const user = rows[0]
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Account is not active.' })
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Administrator access required.' })
        }

        req.user = {
            ...decoded,
            account: 'admin',
            id: user.id,
            userId: user.id,
            username: user.username,
            role: 'admin',
        }
        req.admin = { id: user.id, username: user.username, role: 'admin', is_active: true }
        return next()
    } catch (err) {
        if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token invalid or expired.' })
        }
                return serverError(res, err, '[requireAdmin]')
    }
}
