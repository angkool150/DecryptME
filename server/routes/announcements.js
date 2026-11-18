// server/routes/announcements.js
// GET /api/announcements — published announcements for the student dashboard.

import { Router } from 'express'
import { serverError } from '../lib/errors.js'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, title, body, published_at
             FROM announcements
             WHERE is_published = TRUE
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT 10`
        )
        return res.json({ announcements: rows })
    } catch (err) {
                return serverError(res, err, '[announcements/list]')
    }
})

export default router
