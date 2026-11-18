// server/routes/challenges.js
// GET  /api/challenges          — all active categories + challenges
// GET  /api/challenges/:slug    — single challenge + steps
// POST /api/challenges/:slug/submit — flag submission

import { Router } from 'express'
import { serverError } from '../lib/errors.js'
import crypto from 'crypto'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { withSignedUrls } from '../lib/storage.js'
import { parseStepContent } from '../lib/steps.js'

import jwt from 'jsonwebtoken'

const router = Router()

// ── GET /api/challenges ──────────────────────────────────────
// Returns all active categories with their challenges and steps.
router.get('/', async (req, res) => {
    try {
        let userId = null
        const header = req.headers.authorization
        if (header?.startsWith('Bearer ')) {
            try {
                const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
                userId = decoded.userId
            } catch { /* token invalid/expired */ }
        }

        const [categories] = await pool.query(
            'SELECT id, name, slug FROM categories ORDER BY sort_order'
        )

        const [challenges] = await pool.query(
            `SELECT c.id, c.category_id, c.slug, c.title AS name, c.description AS question,
                    c.difficulty, c.points, c.attachment_url AS file,
                    cat.name AS category,
                    ${userId ? '(s.id IS NOT NULL)' : 'FALSE'} AS solved
             FROM challenges c
             JOIN categories cat ON cat.id = c.category_id
             ${userId ? 'LEFT JOIN solves s ON s.challenge_id = c.id AND s.user_id = ' + Number(userId) : ''}
             WHERE c.is_active = TRUE
             ORDER BY c.category_id, c.id`
        )

        // Attachments are stored as object keys; the browser needs signed URLs.
        // `download: true` sets Content-Disposition so clicking downloads directly.
        await withSignedUrls(challenges, 'file', { download: true })

        const [stepsRows] = await pool.query(
            'SELECT challenge_id, content FROM challenge_steps ORDER BY challenge_id, step_order'
        )

        // Group steps by challenge_id
        const stepsByChallenge = {}
        for (const row of stepsRows) {
            if (!stepsByChallenge[row.challenge_id]) {
                stepsByChallenge[row.challenge_id] = []
            }
            stepsByChallenge[row.challenge_id].push(parseStepContent(row.content))
        }

        const enrichedChallenges = challenges.map((c) => ({
            ...c,
            solved: Boolean(c.solved),
            steps: stepsByChallenge[c.id] || [],
        }))

        const result = categories.map((cat) => ({
            title: cat.name,
            challenges: enrichedChallenges.filter((c) => c.category_id === cat.id),
        }))

        return res.json(result)
    } catch (err) {
                return serverError(res, err, '[challenges/list]')
    }
})

// ── GET /api/challenges/:slug ────────────────────────────────
// Returns a single challenge with its ordered steps (parsed JSON).
router.get('/:slug', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.id, c.slug, c.title, c.description,
                    c.difficulty, c.points, c.attachment_url,
                    cat.name AS category
             FROM challenges c
             JOIN categories cat ON cat.id = c.category_id
             WHERE c.slug = ? AND c.is_active = TRUE`,
            [req.params.slug]
        )

        if (!rows.length) return res.status(404).json({ error: 'Challenge not found.' })

        const challenge = rows[0]
        await withSignedUrls(challenge, 'attachment_url', { download: true })

        const [stepRows] = await pool.query(
            'SELECT content FROM challenge_steps WHERE challenge_id = ? ORDER BY step_order',
            [challenge.id]
        )

        // Parse JSON envelope stored by seed.sql
        challenge.steps = stepRows.map((s) => parseStepContent(s.content))

        return res.json(challenge)
    } catch (err) {
                return serverError(res, err, '[challenges/detail]')
    }
})

// ── POST /api/challenges/:slug/submit ───────────────────────
// Validates the submitted flag server-side.
// Requires a valid JWT (user must be logged in).
router.post('/:slug/submit', requireAuth, async (req, res) => {
    const { flag } = req.body
    if (!flag?.trim()) return res.status(400).json({ error: 'Flag is required.' })

    try {
        const [rows] = await pool.query(
            'SELECT id, points, flag_hash FROM challenges WHERE slug = ? AND is_active = TRUE',
            [req.params.slug]
        )
        if (!rows.length) return res.status(404).json({ error: 'Challenge not found.' })

        const challenge = rows[0]
        const submittedHash = crypto.createHash('sha256').update(flag.trim()).digest('hex')
        const isCorrect = submittedHash === String(challenge.flag_hash).trim()

        // Log every attempt (hashed — never raw flag)
        const ipRaw = req.ip || req.socket?.remoteAddress || ''
        const ipHash = ipRaw ? crypto.createHash('sha256').update(ipRaw).digest('hex') : null

        await pool.query(
            `INSERT INTO flag_attempts
                (user_id, challenge_id, submitted_flag_hash, is_correct, ip_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [req.user.userId, challenge.id, submittedHash, isCorrect, ipHash]
        )

        if (!isCorrect) {
            return res.json({ correct: false, message: 'Incorrect flag. Keep digging and try again.' })
        }

        // Award points (the function handles the duplicate-solve guard atomically)
        try {
            await pool.query('SELECT * FROM award_challenge_points(?, ?)', [req.user.userId, challenge.id])
        } catch (procErr) {
            if (procErr.message?.includes('already solved') || procErr.code === '23505') {
                return res.json({ correct: true, already_solved: true, message: 'Already solved!' })
            }
            throw procErr
        }

        return res.json({
            correct: true,
            already_solved: false,
            points_awarded: challenge.points,
            message: `Correct! +${challenge.points} pts`,
        })
    } catch (err) {
                return serverError(res, err, '[challenges/submit]')
    }
})

export default router
