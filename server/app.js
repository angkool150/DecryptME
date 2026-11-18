// server/app.js
// Express application shared by the legacy standalone server (server/index.js)
// and the Next.js catch-all route handler (app/api/[...path]/route.js).

import express from 'express'
import cors from 'cors'
import pool from './db.js'

import authRoutes from './routes/auth.js'
import challengeRoutes from './routes/challenges.js'
import leaderboardRoutes from './routes/leaderboard.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import presenceRoutes from './routes/presence.js'
import announcementRoutes from './routes/announcements.js'

const app = express()

app.use(cors())
app.use(express.json())

// Mount API routes
app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/presence', presenceRoutes)
app.use('/api/announcements', announcementRoutes)

// Health check endpoint
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1')
        res.json({ status: 'ok', db: 'connected' })
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message })
    }
})

// Central error handler so malformed JSON, oversized bodies, etc. return JSON.
app.use((err, _req, res, next) => {
    console.error('[api]', err)
    if (res.headersSent) return next(err)
    const status = err?.status || err?.statusCode || 500
    const message =
        err?.type === 'entity.too.large'
            ? 'Request body is too large.'
            : err?.type === 'entity.parse.failed'
              ? 'Invalid JSON body.'
              : 'Server error.'
    return res.status(status).json({ error: message })
})

export default app
