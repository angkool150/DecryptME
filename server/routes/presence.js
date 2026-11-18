// server/routes/presence.js
// POST /api/presence/heartbeat — records activity for online-user monitoring.

import { Router } from 'express'
import { serverError } from '../lib/errors.js'
import { PRESENCE_ACTIVITY } from '../../src/lib/presence.js'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/heartbeat', requireAuth, async (req, res) => {
    const path = String(req.body?.path || '').slice(0, 255) || '/'
    const activity = (String(req.body?.activity || '').trim() || PRESENCE_ACTIVITY[path] || 'Browsing platform').slice(0, 120)

    try {
        if (req.user.account === 'admin') {
            await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [
                req.user.id ?? req.user.userId,
            ])
            return res.json({ ok: true, activity, path, tracked: false })
        }

        const userId = req.user.userId ?? req.user.id
        await pool.query(
            `INSERT INTO user_presence
                (user_id, last_heartbeat_at, current_activity, current_path, last_login_at)
             VALUES (?, NOW(), ?, ?, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                last_heartbeat_at = NOW(),
                current_activity = EXCLUDED.current_activity,
                current_path = EXCLUDED.current_path`,
            [userId, activity, path]
        )

        await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [userId])

        return res.json({ ok: true, activity, path })
    } catch (err) {
                return serverError(res, err, '[presence/heartbeat]')
    }
})

export default router
