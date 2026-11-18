// server/routes/admin.js
// Administrator API: overview, challenge/module CRUD, submission monitoring,
// presence, announcements, audit logs, and user account management.

import express, { Router } from 'express'
import { serverError } from '../lib/errors.js'
import crypto from 'crypto'
import pool, { hashFlag } from '../db.js'
import { requireAdmin } from '../middleware/admin.js'
import { writeAudit } from '../lib/audit.js'
import { deleteStorageObject, isStorageKey, normalizeStorageInput, signStorageKey, uploadStorageObject } from '../lib/storage.js'
import { parsePagination } from '../lib/pagination.js'
import { parseStepContent } from '../lib/steps.js'

const router = Router()
const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'insane'])
const ONLINE_INTERVAL = "interval '90 seconds'"
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
const MIME_BY_EXTENSION = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
}
const readAttachmentBody = express.raw({
    type: 'application/octet-stream',
    limit: MAX_UPLOAD_BYTES,
})

router.use(requireAdmin)

function toNumber(value, fallback = null) {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function cleanText(value, max = 5000) {
    return String(value ?? '').trim().slice(0, max)
}

function normalizeFlag(value) {
    const trimmed = String(value ?? '').trim()
    if (!trimmed) return ''

    const wrapped = trimmed.match(/^flag\{([\s\S]*)\}$/i)
    const inner = (wrapped ? wrapped[1] : trimmed).trim().slice(0, 245)
    return inner ? `flag{${inner}}` : ''
}

function categoryAllowsAttachment(category) {
    const slug = String(category?.slug ?? category?.category_slug ?? '').trim().toLowerCase()
    const name = String(category?.name ?? category?.category_name ?? '').trim().toLowerCase()
    return slug === 'forensics' || name === 'forensics'
}

async function findCategory(categoryId) {
    const [rows] = await pool.query(
        'SELECT id, name, slug FROM categories WHERE id = ?',
        [categoryId]
    )
    return rows[0] || null
}

function parseStepRow(row) {
    const parsed = parseStepContent(row.content)

    return {
        id: row.id,
        step_order: row.step_order,
        text: parsed.text || '',
        info: parsed.info || null,
    }
}

function buildStepContent({ text, info }) {
    const payload = { text: cleanText(text, 10000) }
    const title = cleanText(info?.title, 160)
    const body = cleanText(info?.body, 5000)
    const link = cleanText(info?.link, 2048)

    if (title || body || link) {
        payload.info = {}
        if (title) payload.info.title = title
        if (body) payload.info.body = body
        if (link) payload.info.link = link
    }

    return JSON.stringify(payload)
}

async function getChallengeDetail(id) {
    const [rows] = await pool.query(
        `SELECT c.*, cat.name AS category_name, cat.slug AS category_slug
         FROM challenges c
         JOIN categories cat ON cat.id = c.category_id
         WHERE c.id = ?`,
        [id]
    )
    if (!rows.length) return null

    const [stepRows] = await pool.query(
        'SELECT id, step_order, content FROM challenge_steps WHERE challenge_id = ? ORDER BY step_order, id',
        [id]
    )

    return {
        ...rows[0],
        points: Number(rows[0].points),
        is_active: Boolean(rows[0].is_active),
        steps: stepRows.map(parseStepRow),
    }
}

// ============================================================
// Challenge attachments
// ============================================================
router.get('/uploads/download', async (req, res) => {
    try {
        const key = normalizeStorageInput(req.query.url)
        if (!key || !isStorageKey(key) || !/^(Challenges|Profile)\//.test(key)) {
            return res.status(400).json({ error: 'Invalid attachment.' })
        }
        const url = await signStorageKey(key, { download: true })
        if (!url) return res.status(404).json({ error: 'Attachment not found.' })
        return res.json({ url })
    } catch (err) {
                return serverError(res, err, '[admin/uploads/download]', 'Could not create download link.')
    }
})

router.post(
    '/uploads',
    (req, res, next) => {
        readAttachmentBody(req, res, (err) => {
            if (!err) return next()
            if (err.type === 'entity.too.large') {
                return res.status(413).json({ error: 'Attachment must be 25 MB or smaller.' })
            }
            return res.status(400).json({ error: 'Attachment upload failed.' })
        })
    },
    async (req, res) => {
        try {
            if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
                return res.status(400).json({ error: 'Choose a file to upload.' })
            }

            const requestedName = String(req.query.name || 'attachment.bin')
            const originalName = requestedName
                .replace(/\\/g, '/')
                .split('/')
                .pop()
                .slice(0, 180) || 'attachment.bin'
            const dot = originalName.lastIndexOf('.')
            const sourceExtension = dot > 0 ? originalName.slice(dot) : ''
            const extension = sourceExtension.toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 16)
            const stem = (dot > 0 ? originalName.slice(0, dot) : originalName)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 60) || 'attachment'
            const storedName = `${stem}-${crypto.randomUUID().slice(0, 8)}${extension}`
            const objectKey = `Challenges/${storedName}`

            await uploadStorageObject(
                objectKey,
                req.body,
                MIME_BY_EXTENSION[extension] || 'application/octet-stream'
            )

            return res.status(201).json({
                url: objectKey,
                name: originalName,
                size: req.body.length,
            })
        } catch (err) {
            if (err?.code === 'STORAGE_NOT_CONFIGURED') {
                console.error('[admin/uploads]', err.message)
                return res.status(503).json({ error: err.message })
            }
                        return serverError(res, err, '[admin/uploads]', 'Attachment upload failed.')
        }
    }
)

// ============================================================
// Overview
// ============================================================
router.get('/overview', async (_req, res) => {
    try {
        const [
            [userRows],
            [challengeRows],
            [solveRows],
            [attemptRows],
            [onlineRows],
            [announcementRows],
            [recentSolves],
            [recentAudit],
            [topChallenges],
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active) AS active FROM users'),
            pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active) AS active FROM challenges'),
            pool.query('SELECT COUNT(*) AS total FROM solves'),
            pool.query('SELECT COUNT(*) AS total FROM flag_attempts'),
            pool.query(
                `SELECT COUNT(*) AS total FROM users u
                 LEFT JOIN user_presence p ON p.user_id = u.id
                 WHERE u.is_active = TRUE
                   AND p.last_heartbeat_at >= NOW() - ${ONLINE_INTERVAL}`
            ),
            pool.query('SELECT COUNT(*) AS total FROM announcements WHERE is_published = TRUE'),
            pool.query(
                `SELECT s.id, u.username, c.title AS challenge_title, cat.name AS category,
                        s.points_awarded, s.solved_at
                 FROM solves s
                 JOIN users u ON u.id = s.user_id
                 JOIN challenges c ON c.id = s.challenge_id
                 JOIN categories cat ON cat.id = c.category_id
                 ORDER BY s.solved_at DESC LIMIT 8`
            ),
            pool.query(
                `SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at,
                        u.username AS actor_username
                 FROM audit_logs a
                 LEFT JOIN users u ON u.id = a.actor_user_id
                 ORDER BY a.created_at DESC LIMIT 8`
            ),
            pool.query(
                `SELECT c.id, c.title, c.points, cat.name AS category,
                        COUNT(s.id) AS solves,
                        (SELECT COUNT(*) FROM flag_attempts fa WHERE fa.challenge_id = c.id) AS attempts
                 FROM challenges c
                 JOIN categories cat ON cat.id = c.category_id
                 LEFT JOIN solves s ON s.challenge_id = c.id
                 WHERE c.is_active = TRUE
                 GROUP BY c.id, c.title, c.points, cat.name
                 ORDER BY solves DESC, attempts DESC
                 LIMIT 5`
            ),
        ])

        return res.json({
            stats: {
                users_total: Number(userRows[0]?.total || 0),
                users_active: Number(userRows[0]?.active || 0),
                challenges_total: Number(challengeRows[0]?.total || 0),
                challenges_active: Number(challengeRows[0]?.active || 0),
                solves_total: Number(solveRows[0]?.total || 0),
                attempts_total: Number(attemptRows[0]?.total || 0),
                online_now: Number(onlineRows[0]?.total || 0),
                announcements_published: Number(announcementRows[0]?.total || 0),
            },
            recent_solves: recentSolves,
            recent_audit: recentAudit,
            top_challenges: topChallenges,
        })
    } catch (err) {
                return serverError(res, err, '[admin/overview]')
    }
})

// ============================================================
// Challenges and modules
// ============================================================
router.get('/challenges', async (_req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, slug FROM categories ORDER BY sort_order, id'
        )
        const [challenges] = await pool.query(
            `SELECT c.id, c.category_id, c.slug, c.title, c.description, c.difficulty,
                    c.points, c.attachment_url, c.is_active, c.created_at, c.updated_at,
                    cat.name AS category_name,
                    (SELECT COUNT(*) FROM solves s WHERE s.challenge_id = c.id) AS solves,
                    (SELECT COUNT(*) FROM flag_attempts fa WHERE fa.challenge_id = c.id) AS attempts,
                    (SELECT COUNT(*) FROM challenge_steps cs WHERE cs.challenge_id = c.id) AS step_count
             FROM challenges c
             JOIN categories cat ON cat.id = c.category_id
             ORDER BY c.is_active DESC, cat.sort_order, c.id DESC`
        )
        return res.json({ categories, challenges })
    } catch (err) {
                return serverError(res, err, '[admin/challenges]')
    }
})

router.get('/challenges/:id', async (req, res) => {
    try {
        const challenge = await getChallengeDetail(req.params.id)
        if (!challenge) return res.status(404).json({ error: 'Challenge not found.' })
        return res.json({ challenge })
    } catch (err) {
                return serverError(res, err, '[admin/challenges/detail]')
    }
})

router.post('/challenges', async (req, res) => {
    const title = cleanText(req.body?.title, 150)
    const slug = cleanText(req.body?.slug, 100).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    const description = cleanText(req.body?.description, 10000)
    const difficulty = cleanText(req.body?.difficulty, 20).toLowerCase()
    const points = toNumber(req.body?.points)
    const categoryId = toNumber(req.body?.category_id)
    const flag = normalizeFlag(req.body?.flag)
    const requestedAttachmentUrl = normalizeStorageInput(cleanText(req.body?.attachment_url, 2048)) || null
    const isActive = req.body?.is_active !== false

    if (!title || !slug || !description) {
        return res.status(400).json({ error: 'Title, slug, and description are required.' })
    }
    if (!DIFFICULTIES.has(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty.' })
    }
    if (!Number.isInteger(points) || points < 1 || points > 10000) {
        return res.status(400).json({ error: 'Points must be between 1 and 10000.' })
    }
    const category = categoryId ? await findCategory(categoryId) : null
    if (!category) {
        return res.status(400).json({ error: 'Choose a valid category.' })
    }
    if (!flag) {
        return res.status(400).json({ error: 'A flag is required when creating a challenge.' })
    }

    const attachmentUrl = categoryAllowsAttachment(category) ? requestedAttachmentUrl : null

    try {
        const [result] = await pool.query(
            `INSERT INTO challenges
                (category_id, slug, title, description, difficulty, points, flag_hash, attachment_url, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id`,
            [categoryId, slug, title, description, difficulty, points, hashFlag(flag), attachmentUrl, isActive]
        )

        await writeAudit(req, {
            action: 'challenge.create',
            entityType: 'challenge',
            entityId: result.insertId,
            details: {
                title,
                slug,
                category_id: categoryId,
                difficulty,
                points,
                is_active: isActive,
                attachment_url: attachmentUrl,
            },
        })

        const challenge = await getChallengeDetail(result.insertId)
        return res.status(201).json({ challenge })
    } catch (err) {
        if (err?.code === '23505') {
            return res.status(409).json({ error: 'That slug is already in use.' })
        }
                return serverError(res, err, '[admin/challenges/create]')
    }
})

router.put('/challenges/:id', async (req, res) => {
    const id = toNumber(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid challenge.' })

    try {
        const existing = await getChallengeDetail(id)
        if (!existing) return res.status(404).json({ error: 'Challenge not found.' })

        const title = cleanText(req.body?.title ?? existing.title, 150)
        const slug = cleanText(req.body?.slug ?? existing.slug, 100).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        const description = cleanText(req.body?.description ?? existing.description, 10000)
        const difficulty = cleanText(req.body?.difficulty ?? existing.difficulty, 20).toLowerCase()
        const points = toNumber(req.body?.points, existing.points)
        const categoryId = toNumber(req.body?.category_id, existing.category_id)
        const requestedAttachmentUrl = normalizeStorageInput(
            cleanText(req.body?.attachment_url ?? existing.attachment_url, 2048)
        ) || null
        const isActive = req.body?.is_active === undefined ? existing.is_active : req.body.is_active !== false
        const flag = normalizeFlag(req.body?.flag)

        if (!title || !slug || !description) {
            return res.status(400).json({ error: 'Title, slug, and description are required.' })
        }
        if (!DIFFICULTIES.has(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty.' })
        }
        if (!Number.isInteger(points) || points < 1 || points > 10000) {
            return res.status(400).json({ error: 'Points must be between 1 and 10000.' })
        }
        const category = categoryId ? await findCategory(categoryId) : null
        if (!category) {
            return res.status(400).json({ error: 'Choose a valid category.' })
        }

        const attachmentUrl = categoryAllowsAttachment(category) ? requestedAttachmentUrl : null

        const fields = [
            'category_id = ?', 'slug = ?', 'title = ?', 'description = ?',
            'difficulty = ?', 'points = ?', 'attachment_url = ?', 'is_active = ?',
        ]
        const values = [categoryId, slug, title, description, difficulty, points, attachmentUrl, isActive]

        if (flag) {
            fields.push('flag_hash = ?')
            values.push(hashFlag(flag))
        }
        values.push(id)

        await pool.query(`UPDATE challenges SET ${fields.join(', ')} WHERE id = ?`, values)

        await writeAudit(req, {
            action: 'challenge.update',
            entityType: 'challenge',
            entityId: id,
            details: {
                title,
                slug,
                category_id: categoryId,
                difficulty,
                points,
                is_active: isActive,
                flag_changed: Boolean(flag),
                attachment_url: attachmentUrl,
            },
        })

        const challenge = await getChallengeDetail(id)
        return res.json({ challenge })
    } catch (err) {
        if (err?.code === '23505') {
            return res.status(409).json({ error: 'That slug is already in use.' })
        }
                return serverError(res, err, '[admin/challenges/update]')
    }
})

router.patch('/challenges/:id/publication', async (req, res) => {
    const id = toNumber(req.params.id)
    const isActive = req.body?.is_active !== false

    try {
        const [result] = await pool.query(
            'UPDATE challenges SET is_active = ? WHERE id = ?',
            [isActive, id]
        )
        if (!result.affectedRows) return res.status(404).json({ error: 'Challenge not found.' })

        await writeAudit(req, {
            action: isActive ? 'challenge.publish' : 'challenge.unpublish',
            entityType: 'challenge',
            entityId: id,
            details: { is_active: isActive },
        })

        return res.json({ ok: true, is_active: isActive })
    } catch (err) {
                return serverError(res, err, '[admin/challenges/publication]')
    }
})

router.delete('/challenges/:id', async (req, res) => {
    const id = toNumber(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid challenge.' })

    try {
        const [[challenge]] = await pool.query(
            'SELECT id, attachment_url FROM challenges WHERE id = ?',
            [id]
        )
        if (!challenge) return res.status(404).json({ error: 'Challenge not found.' })

        const [[solveCount]] = await pool.query(
            'SELECT COUNT(*) AS total FROM solves WHERE challenge_id = ?',
            [id]
        )
        const [[attemptCount]] = await pool.query(
            'SELECT COUNT(*) AS total FROM flag_attempts WHERE challenge_id = ?',
            [id]
        )

        await pool.query('DELETE FROM flag_attempts WHERE challenge_id = ?', [id])
        await pool.query('DELETE FROM solves WHERE challenge_id = ?', [id])

        const [result] = await pool.query('DELETE FROM challenges WHERE id = ?', [id])
        if (!result.affectedRows) return res.status(404).json({ error: 'Challenge not found.' })

        if (challenge.attachment_url) {
            await deleteStorageObject(challenge.attachment_url)
        }

        await writeAudit(req, {
            action: 'challenge.delete',
            entityType: 'challenge',
            entityId: id,
            details: { mode: 'deleted', solves: Number(solveCount.total), attempts: Number(attemptCount.total) },
        })

        return res.json({ ok: true, mode: 'deleted' })
    } catch (err) {
        return serverError(res, err, '[admin/challenges/delete]')
    }
})

router.post('/challenges/:id/steps', async (req, res) => {
    const challengeId = toNumber(req.params.id)
    const text = cleanText(req.body?.text, 10000)

    if (!challengeId || !text) {
        return res.status(400).json({ error: 'Step text is required.' })
    }

    try {
        const challenge = await getChallengeDetail(challengeId)
        if (!challenge) return res.status(404).json({ error: 'Challenge not found.' })

        const [[orderRow]] = await pool.query(
            'SELECT COALESCE(MAX(step_order), 0) AS next_order FROM challenge_steps WHERE challenge_id = ?',
            [challengeId]
        )
        const nextOrder = Number(orderRow.next_order) + 1

        const [result] = await pool.query(
            'INSERT INTO challenge_steps (challenge_id, step_order, content) VALUES (?, ?, ?) RETURNING id',
            [challengeId, nextOrder, buildStepContent(req.body)]
        )

        await writeAudit(req, {
            action: 'module.create',
            entityType: 'challenge_step',
            entityId: result.insertId,
            details: { challenge_id: challengeId, step_order: nextOrder },
        })

        return res.status(201).json({ id: result.insertId, step_order: nextOrder })
    } catch (err) {
                return serverError(res, err, '[admin/steps/create]')
    }
})

router.put('/challenges/:id/steps/reorder', async (req, res) => {
    const challengeId = toNumber(req.params.id)
    const stepIds = Array.isArray(req.body?.stepIds) ? req.body.stepIds.map(Number).filter(Boolean) : []

    if (!challengeId || !stepIds.length) {
        return res.status(400).json({ error: 'Ordered step IDs are required.' })
    }

    const connection = await pool.getConnection()
    try {
        await connection.beginTransaction()

        const [rows] = await connection.query(
            'SELECT id FROM challenge_steps WHERE challenge_id = ?',
            [challengeId]
        )
        const existingIds = new Set(rows.map((row) => Number(row.id)))
        if (stepIds.length !== existingIds.size || stepIds.some((id) => !existingIds.has(id))) {
            await connection.rollback()
            return res.status(400).json({ error: 'Step list does not match this challenge.' })
        }

        // The table has UNIQUE (challenge_id, step_order). Move every row out of
        // the target range first so swapping two steps cannot collide mid-update.
        const offset = stepIds.length + 1
        await connection.query(
            'UPDATE challenge_steps SET step_order = step_order + ? WHERE challenge_id = ?',
            [offset, challengeId]
        )

        for (let index = 0; index < stepIds.length; index += 1) {
            await connection.query(
                'UPDATE challenge_steps SET step_order = ? WHERE id = ? AND challenge_id = ?',
                [index + 1, stepIds[index], challengeId]
            )
        }

        await connection.commit()

        await writeAudit(req, {
            action: 'module.reorder',
            entityType: 'challenge',
            entityId: challengeId,
            details: { stepIds },
        })

        return res.json({ ok: true })
    } catch (err) {
        await connection.rollback()
                return serverError(res, err, '[admin/steps/reorder]')
    } finally {
        connection.release()
    }
})

router.put('/challenges/:id/steps/:stepId', async (req, res) => {
    const challengeId = toNumber(req.params.id)
    const stepId = toNumber(req.params.stepId)
    const text = cleanText(req.body?.text, 10000)

    if (!challengeId || !stepId || !text) {
        return res.status(400).json({ error: 'Step text is required.' })
    }

    try {
        const [result] = await pool.query(
            'UPDATE challenge_steps SET content = ? WHERE id = ? AND challenge_id = ?',
            [buildStepContent(req.body), stepId, challengeId]
        )
        if (!result.affectedRows) return res.status(404).json({ error: 'Step not found.' })

        await writeAudit(req, {
            action: 'module.update',
            entityType: 'challenge_step',
            entityId: stepId,
            details: { challenge_id: challengeId },
        })

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[admin/steps/update]')
    }
})

router.delete('/challenges/:id/steps/:stepId', async (req, res) => {
    const challengeId = toNumber(req.params.id)
    const stepId = toNumber(req.params.stepId)

    try {
        const [result] = await pool.query(
            'DELETE FROM challenge_steps WHERE id = ? AND challenge_id = ?',
            [stepId, challengeId]
        )
        if (!result.affectedRows) return res.status(404).json({ error: 'Step not found.' })

        const [remaining] = await pool.query(
            'SELECT id FROM challenge_steps WHERE challenge_id = ? ORDER BY step_order, id',
            [challengeId]
        )
        for (let index = 0; index < remaining.length; index += 1) {
            await pool.query('UPDATE challenge_steps SET step_order = ? WHERE id = ?', [index + 1, remaining[index].id])
        }

        await writeAudit(req, {
            action: 'module.delete',
            entityType: 'challenge_step',
            entityId: stepId,
            details: { challenge_id: challengeId },
        })

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[admin/steps/delete]')
    }
})

// ============================================================
// Submission monitoring
// ============================================================
router.get('/submissions', async (req, res) => {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 })
    const challengeId = toNumber(req.query.challengeId)
    const user = cleanText(req.query.user, 100)
    const status = cleanText(req.query.status, 20).toLowerCase()

    const where = []
    const params = []

    if (challengeId) {
        where.push('fa.challenge_id = ?')
        params.push(challengeId)
    }
    if (user) {
        where.push('(u.username LIKE ? OR u.email LIKE ?)')
        params.push(`%${user}%`, `%${user}%`)
    }
    if (status === 'correct' || status === 'incorrect') {
        where.push('fa.is_correct = ?')
        params.push(status === 'correct')
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    try {
        const [[countRow]] = await pool.query(
            `SELECT COUNT(*) AS total FROM flag_attempts fa JOIN users u ON u.id = fa.user_id ${whereSql}`,
            params
        )

        const [rows] = await pool.query(
            `SELECT fa.id, fa.user_id, u.username, u.email,
                    fa.challenge_id, c.title AS challenge_title, cat.name AS category,
                    fa.is_correct, fa.attempted_at,
                    (SELECT COUNT(*) FROM flag_attempts fa2
                     WHERE fa2.user_id = fa.user_id AND fa2.challenge_id = fa.challenge_id
                       AND fa2.id <= fa.id) AS attempt_number,
                    s.points_awarded, s.solved_at
             FROM flag_attempts fa
             JOIN users u ON u.id = fa.user_id
             JOIN challenges c ON c.id = fa.challenge_id
             JOIN categories cat ON cat.id = c.category_id
             LEFT JOIN solves s ON s.user_id = fa.user_id AND s.challenge_id = fa.challenge_id
             ${whereSql}
             ORDER BY fa.attempted_at DESC, fa.id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        const [[summary]] = await pool.query(
            `SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE fa.is_correct) AS correct,
                    COUNT(*) FILTER (WHERE NOT fa.is_correct) AS incorrect,
                    COUNT(DISTINCT fa.user_id) AS users,
                    COUNT(DISTINCT fa.challenge_id) AS challenges
             FROM flag_attempts fa JOIN users u ON u.id = fa.user_id ${whereSql}`,
            params
        )

        return res.json({
            submissions: rows,
            total: Number(countRow.total || 0),
            limit,
            offset,
            summary: {
                total: Number(summary.total || 0),
                correct: Number(summary.correct || 0),
                incorrect: Number(summary.incorrect || 0),
                users: Number(summary.users || 0),
                challenges: Number(summary.challenges || 0),
            },
        })
    } catch (err) {
                return serverError(res, err, '[admin/submissions]')
    }
})

router.get('/solvers', async (req, res) => {
    const challengeId = toNumber(req.query.challengeId)
    const user = cleanText(req.query.user, 100)
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 })

    const where = []
    const params = []

    if (challengeId) {
        where.push('s.challenge_id = ?')
        params.push(challengeId)
    }
    if (user) {
        where.push('(u.username LIKE ? OR u.email LIKE ?)')
        params.push(`%${user}%`, `%${user}%`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    try {
        const [[countRow]] = await pool.query(
            `SELECT COUNT(*) AS total FROM solves s JOIN users u ON u.id = s.user_id ${whereSql}`,
            params
        )

        const [rows] = await pool.query(
            `SELECT s.id, s.user_id, u.username, u.email, s.challenge_id,
                    c.title AS challenge_title, cat.name AS category,
                    s.points_awarded, s.solved_at,
                    (SELECT COUNT(*) FROM flag_attempts fa
                     WHERE fa.user_id = s.user_id AND fa.challenge_id = s.challenge_id) AS attempts,
                    (SELECT COUNT(*) FROM flag_attempts fa
                     WHERE fa.user_id = s.user_id AND fa.challenge_id = s.challenge_id
                       AND fa.is_correct = TRUE) AS correct_attempts
             FROM solves s
             JOIN users u ON u.id = s.user_id
             JOIN challenges c ON c.id = s.challenge_id
             JOIN categories cat ON cat.id = c.category_id
             ${whereSql}
             ORDER BY s.solved_at DESC, s.id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        return res.json({ solvers: rows, total: Number(countRow.total || 0), limit, offset })
    } catch (err) {
                return serverError(res, err, '[admin/solvers]')
    }
})

// ============================================================
// Online users
// ============================================================
router.get('/presence', async (req, res) => {
    const search = cleanText(req.query.user, 100)
    const onlineOnly = req.query.online === 'true'

    const where = []
    const params = []

    if (search) {
        where.push('(u.username LIKE ? OR u.email LIKE ?)')
        params.push(`%${search}%`, `%${search}%`)
    }
    if (onlineOnly) {
        where.push(`p.last_heartbeat_at >= NOW() - ${ONLINE_INTERVAL}`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    try {
        const [users] = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.is_active,
                    u.total_points, u.solved_count, u.last_seen_at,
                    p.last_heartbeat_at, p.current_activity, p.current_path,
                    p.last_login_at,
                    CASE WHEN p.last_heartbeat_at >= NOW() - ${ONLINE_INTERVAL}
                         THEN TRUE ELSE FALSE END AS is_online
             FROM users u
             LEFT JOIN user_presence p ON p.user_id = u.id
             ${whereSql}
             ORDER BY is_online DESC, p.last_heartbeat_at DESC, u.username ASC`,
            params
        )

        const onlineCount = users.filter((row) => row.is_online).length
        return res.json({
            users,
            online_count: onlineCount,
            offline_count: users.length - onlineCount,
        })
    } catch (err) {
                return serverError(res, err, '[admin/presence]')
    }
})

// ============================================================
// Announcements
// ============================================================
router.get('/announcements', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT a.id, a.title, a.body, a.is_published, a.published_at,
                    a.created_at, a.updated_at, a.created_by,
                    u.username AS author
             FROM announcements a
             LEFT JOIN users u ON u.id = a.created_by
             ORDER BY a.created_at DESC`
        )
        return res.json({ announcements: rows })
    } catch (err) {
                return serverError(res, err, '[admin/announcements]')
    }
})

router.post('/announcements', async (req, res) => {
    const title = cleanText(req.body?.title, 160)
    const body = cleanText(req.body?.body, 20000)
    const isPublished = req.body?.is_published === true

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and description are required.' })
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO announcements (title, body, is_published, created_by, published_at)
             VALUES (?, ?, ?, ?, ${isPublished ? 'NOW()' : 'NULL'})
             RETURNING id`,
            [title, body, isPublished, req.admin.id]
        )

        await writeAudit(req, {
            action: 'announcement.create',
            entityType: 'announcement',
            entityId: result.insertId,
            details: { title, is_published: isPublished },
        })

        return res.status(201).json({ id: result.insertId })
    } catch (err) {
                return serverError(res, err, '[admin/announcements/create]')
    }
})

router.put('/announcements/:id', async (req, res) => {
    const id = toNumber(req.params.id)
    const title = cleanText(req.body?.title, 160)
    const body = cleanText(req.body?.body, 20000)
    const isPublished = req.body?.is_published === true

    if (!id || !title || !body) {
        return res.status(400).json({ error: 'Title and description are required.' })
    }

    try {
        const [existingRows] = await pool.query('SELECT id, published_at FROM announcements WHERE id = ?', [id])
        if (!existingRows.length) return res.status(404).json({ error: 'Announcement not found.' })

        await pool.query(
            `UPDATE announcements
             SET title = ?, body = ?, is_published = ?,
                 published_at = CASE
                    WHEN ? = TRUE AND published_at IS NULL THEN NOW()
                    WHEN ? = FALSE THEN NULL
                    ELSE published_at
                 END
             WHERE id = ?`,
            [title, body, isPublished, isPublished, isPublished, id]
        )

        await writeAudit(req, {
            action: 'announcement.update',
            entityType: 'announcement',
            entityId: id,
            details: { title, is_published: isPublished },
        })

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[admin/announcements/update]')
    }
})

router.patch('/announcements/:id/publication', async (req, res) => {
    const id = toNumber(req.params.id)
    const isPublished = req.body?.is_published === true

    try {
        const [result] = await pool.query(
            `UPDATE announcements
             SET is_published = ?,
                 published_at = CASE
                    WHEN ? = TRUE AND published_at IS NULL THEN NOW()
                    WHEN ? = FALSE THEN NULL
                    ELSE published_at
                 END
             WHERE id = ?`,
            [isPublished, isPublished, isPublished, id]
        )
        if (!result.affectedRows) return res.status(404).json({ error: 'Announcement not found.' })

        await writeAudit(req, {
            action: isPublished ? 'announcement.publish' : 'announcement.unpublish',
            entityType: 'announcement',
            entityId: id,
            details: { is_published: isPublished },
        })

        return res.json({ ok: true, is_published: isPublished })
    } catch (err) {
                return serverError(res, err, '[admin/announcements/publication]')
    }
})

router.delete('/announcements/:id', async (req, res) => {
    const id = toNumber(req.params.id)

    try {
        const [result] = await pool.query('DELETE FROM announcements WHERE id = ?', [id])
        if (!result.affectedRows) return res.status(404).json({ error: 'Announcement not found.' })

        await writeAudit(req, {
            action: 'announcement.delete',
            entityType: 'announcement',
            entityId: id,
        })

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[admin/announcements/delete]')
    }
})

// ============================================================
// Audit logs
// ============================================================
router.get('/audit-logs', async (req, res) => {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 })
    const action = cleanText(req.query.action, 80)
    const actor = cleanText(req.query.actor, 100)
    const entityType = cleanText(req.query.entityType, 50)

    const where = []
    const params = []

    if (action) {
        where.push('a.action LIKE ?')
        params.push(`%${action}%`)
    }
    if (actor) {
        where.push("COALESCE(u.username, '') LIKE ?")
        params.push(`%${actor}%`)
    }
    if (entityType) {
        where.push('a.entity_type = ?')
        params.push(entityType)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const fromSql = `FROM audit_logs a
             LEFT JOIN users u ON u.id = a.actor_user_id`

    try {
        const [[countRow]] = await pool.query(
            `SELECT COUNT(*) AS total ${fromSql} ${whereSql}`,
            params
        )
        const [rows] = await pool.query(
            `SELECT a.id, a.actor_user_id,
                    u.username AS actor_username,
                    a.action, a.entity_type, a.entity_id, a.details,
                    a.ip_hash, a.user_agent, a.created_at
             ${fromSql}
             ${whereSql}
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        const parsed = rows.map((row) => {
            let details = row.details
            if (typeof details === 'string') {
                try {
                    details = JSON.parse(details)
                } catch {
                    // Keep raw text when legacy details are not JSON.
                }
            }
            return { ...row, details }
        })

        return res.json({ logs: parsed, total: Number(countRow.total || 0), limit, offset })
    } catch (err) {
                return serverError(res, err, '[admin/audit-logs]')
    }
})

// ============================================================
// User accounts
// ============================================================
router.get('/users', async (req, res) => {
    const search = cleanText(req.query.user, 100)
    const where = search ? 'WHERE u.username LIKE ? OR u.email LIKE ?' : ''
    const params = search ? [`%${search}%`, `%${search}%`] : []

    try {
        const [users] = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.is_active, u.total_points,
                    u.solved_count, u.created_at, u.last_seen_at,
                    p.last_heartbeat_at, p.current_activity, p.last_login_at,
                    CASE WHEN p.last_heartbeat_at >= NOW() - ${ONLINE_INTERVAL}
                         THEN TRUE ELSE FALSE END AS is_online
             FROM users u
             LEFT JOIN user_presence p ON p.user_id = u.id
             ${where}
             ORDER BY u.role DESC, u.username ASC`,
            params
        )
        return res.json({ users })
    } catch (err) {
                return serverError(res, err, '[admin/users]')
    }
})

router.patch('/users/:id', async (req, res) => {
    const id = toNumber(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid user.' })

    const role = req.body?.role === undefined ? null : cleanText(req.body.role, 20)
    const isActive = req.body?.is_active === undefined ? null : req.body.is_active === true

    if (role !== null && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' })
    }
    if (role === 'admin') {
        return res.status(400).json({ error: 'Administrator accounts are managed separately from student users.' })
    }
    if (role === null && isActive === null) {
        return res.status(400).json({ error: 'Nothing to update.' })
    }
    if (req.user?.account !== 'admin' && id === req.admin?.id && (role === 'user' || isActive === false)) {
        return res.status(400).json({ error: 'You cannot remove your own administrator access.' })
    }

    try {
        const [rows] = await pool.query('SELECT id, username, role, is_active FROM users WHERE id = ?', [id])
        if (!rows.length) return res.status(404).json({ error: 'User not found.' })

        const fields = []
        const values = []
        if (role !== null) {
            fields.push('role = ?')
            values.push(role)
        }
        if (isActive !== null) {
            fields.push('is_active = ?')
            values.push(isActive)
        }
        values.push(id)

        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)

        if (isActive === false) {
            await pool.query(
                `UPDATE user_presence
                 SET last_heartbeat_at = NULL, current_activity = NULL, current_path = NULL
                 WHERE user_id = ?`,
                [id]
            )
        }

        await writeAudit(req, {
            action: 'user.update',
            entityType: 'user',
            entityId: id,
            details: { username: rows[0].username, role, is_active: isActive },
        })

        return res.json({ ok: true })
    } catch (err) {
                return serverError(res, err, '[admin/users/update]')
    }
})

export default router
