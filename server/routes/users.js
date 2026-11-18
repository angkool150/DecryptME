// server/routes/users.js
import express, { Router } from 'express'
import { serverError } from '../lib/errors.js'
import crypto from 'crypto'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateUsername } from '../lib/validate.js'
import { deleteStorageObject, normalizeStorageInput, signStorageKey, uploadStorageObject, withSignedUrls } from '../lib/storage.js'

const router = Router()
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const AVATAR_MIME = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
}
const readAvatarBody = express.raw({ type: 'application/octet-stream', limit: MAX_AVATAR_BYTES })

async function resolveAvatar(user) {
    if (!user?.avatar_url) return user
    const signed = await signStorageKey(user.avatar_url)
    if (signed) user.avatar_url = signed
    return user
}

// GET /api/users/me — full profile data for the authenticated operator
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId ?? req.user.id
        const isAdmin = req.user.account === 'admin' || req.user.role === 'admin'

        if (isAdmin) {
            const [rows] = await pool.query(
                `SELECT id, username, email, bio, avatar_url, country, timezone, created_at
                 FROM users WHERE id = ? AND is_active = TRUE`,
                [userId]
            )
            const admin = rows[0] || null
            if (admin) await resolveAvatar(admin)

            return res.json({
                user: {
                    id: admin?.id ?? userId,
                    username: admin?.username || req.user.username,
                    email: admin?.email || '',
                    role: 'admin',
                    account: 'admin',
                    bio: admin?.bio || 'DecryptMe platform administrator',
                    avatar_url: admin?.avatar_url || null,
                    country: admin?.country || 'Global',
                    timezone: admin?.timezone || 'UTC',
                    total_points: 0,
                    solved_count: 0,
                    created_at: admin?.created_at || null,
                    rank: '-',
                },
                skills: [],
                activity: [],
                achievements: [],
            })
        }

        // 1. Basic user details
        const [userRows] = await pool.query(
            `SELECT id, username, email, role, bio, avatar_url, country, timezone,
                    total_points, solved_count, created_at
             FROM users WHERE id = ? AND is_active = TRUE`,
            [userId]
        )
        if (!userRows.length) {
            return res.status(404).json({ error: 'User not found' })
        }
        const user = userRows[0]
        await resolveAvatar(user)

        // 2. Rank position from view
        const [rankRows] = await pool.query(
            'SELECT rank_position FROM v_leaderboard WHERE user_id = ?',
            [userId]
        )
        const rank = rankRows[0]?.rank_position || '-'

        // 3. Category skill breakdown (total challenges vs user solved per category)
        const [categories] = await pool.query(
            'SELECT id, name FROM categories ORDER BY sort_order'
        )

        const [catStats] = await pool.query(
            `SELECT c.category_id,
                    COUNT(DISTINCT c.id) AS total_challenges,
                    COUNT(DISTINCT s.challenge_id) AS solved_challenges
             FROM challenges c
             LEFT JOIN solves s ON s.challenge_id = c.id AND s.user_id = ?
             WHERE c.is_active = TRUE
             GROUP BY c.category_id`,
            [userId]
        )

        const skills = categories.map((cat) => {
            const found = catStats.find((s) => s.category_id === cat.id)
            return {
                name: cat.name,
                solved: Number(found?.solved_challenges || 0),
                total: Number(found?.total_challenges || 0),
            }
        })

        // 4. Recent activity (last 10 solves for this user)
        const [activityRows] = await pool.query(
            `SELECT s.id AS solve_id, c.title AS name, cat.name AS category,
                    s.points_awarded AS points, s.solved_at
             FROM solves s
             JOIN challenges c ON c.id = s.challenge_id
             JOIN categories cat ON cat.id = c.category_id
             WHERE s.user_id = ?
             ORDER BY s.solved_at DESC
             LIMIT 10`,
            [userId]
        )

        // 5. Achievements (all achievements with unlocked status for this user)
        const [achievements] = await pool.query(
            `SELECT a.id, a.code, a.name, a.description, a.criteria,
                    (ua.unlocked_at IS NOT NULL) AS unlocked,
                    ua.unlocked_at
             FROM achievements a
             LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
             WHERE a.is_active = TRUE
             ORDER BY a.id`,
            [userId]
        )

        return res.json({
            user: {
                ...user,
                rank,
            },
            skills,
            activity: activityRows,
            achievements,
        })
    } catch (err) {
                return serverError(res, err, '[users/me]', 'Server error')
    }
})

// PATCH /api/users/me — update own username
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId ?? req.user.id
        const hasUsername = req.body?.username !== undefined

        if (!hasUsername) {
            return res.status(400).json({ error: 'Nothing to update.' })
        }

        const usernameResult = validateUsername(req.body.username)
        if (usernameResult.error) return res.status(400).json({ error: usernameResult.error })

        const username = usernameResult.value
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE lower(username) = lower(?) AND id <> ? LIMIT 1',
            [username, userId]
        )
        if (existing[0]) return res.status(409).json({ error: 'That username is already in use.' })

        const [result] = await pool.query(
            'UPDATE users SET username = ? WHERE id = ? AND is_active = TRUE',
            [username, userId]
        )
        if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' })

        return res.json({ ok: true, user: { username } })
    } catch (err) {
        if (err?.code === '23505') return res.status(409).json({ error: 'That username is already in use.' })
                return serverError(res, err, '[users/me:update]')
    }
})

// POST /api/users/me/avatar — upload profile picture (octet-stream + ?name=)
router.post(
    '/me/avatar',
    requireAuth,
    (req, res, next) => {
        readAvatarBody(req, res, (err) => {
            if (!err) return next()
            if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Avatar must be 5 MB or smaller.' })
            return res.status(400).json({ error: 'Avatar upload failed.' })
        })
    },
    async (req, res) => {
        try {
            if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
                return res.status(400).json({ error: 'Choose an image to upload.' })
            }

            const requestedName = String(req.query.name || 'avatar.jpg')
                .replace(/\\/g, '/')
                .split('/')
                .pop()
                .slice(0, 120) || 'avatar.jpg'
            const dot = requestedName.lastIndexOf('.')
            const ext = (dot > 0 ? requestedName.slice(dot) : '.jpg').toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10)
            const mime = AVATAR_MIME[ext]
            if (!mime) return res.status(400).json({ error: 'Avatar must be a PNG, JPG, GIF, or WEBP image.' })

            const userId = req.user.userId ?? req.user.id

            const [previousRows] = await pool.query(
                'SELECT avatar_url FROM users WHERE id = ? AND is_active = TRUE',
                [userId]
            )
            const previousAvatar = previousRows[0]?.avatar_url || null

            const objectKey = `Profile/${userId}-${crypto.randomUUID().slice(0, 8)}${ext}`

            await uploadStorageObject(objectKey, req.body, mime)
            await pool.query('UPDATE users SET avatar_url = ? WHERE id = ? AND is_active = TRUE', [
                normalizeStorageInput(objectKey),
                userId,
            ])

            if (previousAvatar && previousAvatar !== objectKey) {
                await deleteStorageObject(previousAvatar)
            }

            const url = await signStorageKey(objectKey)
            return res.json({ ok: true, avatar_url: url || objectKey })
        } catch (err) {
            if (err?.code === 'STORAGE_NOT_CONFIGURED') return res.status(503).json({ error: err.message })
                        return serverError(res, err, '[users/me/avatar]', 'Avatar upload failed.')
        }
    }
)

// GET /api/users/dashboard — data needed by the Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId ?? req.user.id
        const isAdmin = req.user.account === 'admin' || req.user.role === 'admin'

        // User stats + rank
        let user = null
        if (!isAdmin) {
            const [userRows] = await pool.query(
                `SELECT u.id, u.username, u.avatar_url, u.total_points, u.solved_count,
                        l.rank_position
                 FROM users u
                 LEFT JOIN v_leaderboard l ON l.user_id = u.id
                 WHERE u.id = ?`,
                [userId]
            )
            user = userRows[0] || null
        }

        // Top 6 leaderboard users
        const adminLeaderboardSql = `SELECT
                rank_position::int AS rank_position,
                id AS user_id, username, avatar_url,
                total_points AS points, solved_count AS solved_challenges
             FROM (
                SELECT id, username, avatar_url, total_points, solved_count,
                       RANK() OVER (ORDER BY total_points DESC, solved_count DESC, username ASC) AS rank_position
                FROM users
                WHERE is_active = TRUE
             ) ranked`

        const [topPlayers] = await pool.query(
            isAdmin
                ? `${adminLeaderboardSql} LIMIT 6`
                : `SELECT rank_position, user_id, username, avatar_url, points, solved_challenges
                   FROM v_leaderboard
                   LIMIT 6`
        )

        await withSignedUrls(topPlayers, 'avatar_url')

        const [avatarRows] = await pool.query(
            'SELECT avatar_url FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        )
        const signedUserAvatar = avatarRows[0]?.avatar_url
            ? await signStorageKey(avatarRows[0].avatar_url)
            : null

        // Calculate next rank target
        let nextRankPoints = 0
        let nextRankPosition = null
        if (user && user.rank_position > 1) {
            const [aheadRow] = await pool.query(
                `SELECT rank_position, points FROM v_leaderboard WHERE rank_position = ?`,
                [user.rank_position - 1]
            )
            if (aheadRow.length) {
                nextRankPosition = aheadRow[0].rank_position
                nextRankPoints = Math.max(0, aheadRow[0].points - user.total_points + 1)
            }
        }

        // Featured challenge (e.g. an active challenge or latest unsolved)
        const [featuredChallenge] = await pool.query(
            `SELECT c.id, c.slug, c.title, c.description, c.points, c.attachment_url,
                    cat.name AS category,
                    (SELECT COUNT(*) FROM flag_attempts fa WHERE fa.challenge_id = c.id) AS total_attempts
             FROM challenges c
             JOIN categories cat ON cat.id = c.category_id
             WHERE c.is_active = TRUE
             ORDER BY c.id ASC
             LIMIT 1`
        )

        return res.json({
            user: {
                username: user?.username || req.user?.username || '',
                avatar_url: signedUserAvatar,
                total_points: user?.total_points || 0,
                solved_count: user?.solved_count || 0,
                rank: user?.rank_position || 1,
                nextRankPosition,
                nextRankPoints,
                account: isAdmin ? 'admin' : 'user',
            },
            leaderboard: topPlayers,
            featured: featuredChallenge[0] || null,
        })
    } catch (err) {
                return serverError(res, err, '[users/dashboard]', 'Server error')
    }
})

export default router
