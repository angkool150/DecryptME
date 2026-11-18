// server/routes/leaderboard.js
// GET /api/leaderboard  — top N players + logged-in user's rank

import { Router } from 'express'
import { serverError } from '../lib/errors.js'
import { withSignedUrls } from '../lib/storage.js'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

const PUBLIC_SELECT = `SELECT rank_position, user_id, username, avatar_url,
            points, solved_challenges
     FROM v_leaderboard`

const ADMIN_SELECT = `SELECT
            rank_position::int AS rank_position,
            id AS user_id, username, avatar_url,
            total_points AS points, solved_count AS solved_challenges,
            role
     FROM (
            SELECT id, username, avatar_url, total_points, solved_count, role,
                   RANK() OVER (ORDER BY total_points DESC, solved_count DESC, username ASC) AS rank_position
            FROM users
            WHERE is_active = TRUE
     ) ranked`

async function isAdminRequest(req) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return { isAdmin: false, userId: null }

    try {
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
        const userId = decoded.id ?? decoded.userId
        if (decoded.account === 'admin' || decoded.role === 'admin') {
            return { isAdmin: true, userId }
        }
        return { isAdmin: false, userId }
    } catch {
        return { isAdmin: false, userId: null }
    }
}

router.get('/', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200)

    try {
        const { isAdmin, userId } = await isAdminRequest(req)
        const selectSql = isAdmin ? ADMIN_SELECT : PUBLIC_SELECT

        const [top] = await pool.query(`${selectSql} LIMIT ?`, [limit])

        let myRank = null
        if (userId) {
            const [myRows] = await pool.query(`${selectSql} ${isAdmin ? 'WHERE id = ?' : 'WHERE user_id = ?'}`, [
                userId,
            ])
            myRank = myRows[0] || null
        }

        await withSignedUrls(top, 'avatar_url')
        if (myRank) await withSignedUrls([myRank], 'avatar_url')

        return res.json({
            leaderboard: top,
            my_rank: myRank,
            scope: isAdmin ? 'all' : 'users',
        })
    } catch (err) {
                return serverError(res, err, '[leaderboard]')
    }
})

export default router

