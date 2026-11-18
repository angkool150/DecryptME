// server/lib/audit.js
// Writes administrative actions to the audit_logs table.

import crypto from 'crypto'
import pool from '../db.js'

export function hashIp(ip) {
    if (!ip) return null
    return crypto.createHash('sha256').update(String(ip)).digest('hex')
}

export async function writeAudit(req, {
    actorUserId = null,
    actorAdminId = null,
    action,
    entityType = null,
    entityId = null,
    details = null,
} = {}) {
    // Administrators are rows in `users` with role = 'admin', so both actor
    // sources resolve to the same column. The audit table has no separate
    // actor_admin_id column.
    const actor =
        actorUserId ??
        actorAdminId ??
        req.user?.userId ??
        req.user?.id ??
        req.admin?.id ??
        null

    const ip = req.ip || req.socket?.remoteAddress || ''
    const userAgent = String(req.get?.('user-agent') || '').slice(0, 255)

    try {
        await pool.query(
            `INSERT INTO audit_logs
                (actor_user_id, action, entity_type, entity_id, details, ip_hash, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                actor,
                action,
                entityType,
                entityId === null || entityId === undefined ? null : String(entityId),
                details ? JSON.stringify(details) : null,
                hashIp(ip),
                userAgent || null,
            ]
        )
    } catch (err) {
        // An audit failure must not break the administrative action itself.
        console.error('[audit] failed to write entry:', err.message)
    }
}
