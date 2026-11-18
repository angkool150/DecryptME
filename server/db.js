// server/db.js
// PostgreSQL (Supabase) connection pool shared across all route handlers.
//
// The routes were written against MySQL, so this module exposes a small
// compatibility adapter: `query()` accepts `?` placeholders and returns the
// `[rows, fields]` tuple that mysql2 produced, with `insertId` / `affectedRows`
// mirrored onto the rows array. That keeps the SQL in the routes readable while
// the queries themselves are valid PostgreSQL.

import dotenv from 'dotenv'
import path from 'path'
import crypto from 'crypto'
import pg from 'pg'

// Resolve local env files from the project root. On Vercel these files are not
// present, so this is a no-op and the dashboard environment variables are used.
// dotenv never overwrites values that are already set in process.env.
const projectRoot = process.cwd()
dotenv.config({ path: path.join(projectRoot, 'server', '.env') })
dotenv.config({ path: path.join(projectRoot, '.env') })
dotenv.config({ path: path.join(projectRoot, '.env.local') })

const { Pool, types } = pg

// PostgreSQL returns bigint (int8) values as strings. Every bigint in this
// schema is an id, count, or rank that fits safely in a JS number.
types.setTypeParser(types.builtins.INT8, (value) => (value === null ? null : Number(value)))

const ssl = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }

// Keep connections per instance small: every serverless instance gets its own
// pool, and a large max can exhaust a database pooler under concurrency.
const max = Number(process.env.DB_POOL_MAX) || 5

const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl, max, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 })
    : new Pool({
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'postgres',
          ssl,
          max,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 15_000,
      })

pool.on('error', (err) => {
    console.error('[db] idle client error:', err.message)
})

// Convert MySQL-style `?` placeholders into PostgreSQL `$1 .. $n`.
function toPgPlaceholders(text) {
    let index = 0
    return text.replace(/\?/g, () => `$${++index}`)
}

function shape(result) {
    const rows = result.rows
    rows.affectedRows = result.rowCount
    if (rows.length === 1 && rows[0] && Object.prototype.hasOwnProperty.call(rows[0], 'id')) {
        rows.insertId = rows[0].id
    }
    return [rows, result.fields]
}

async function query(text, params = []) {
    return shape(await pool.query(toPgPlaceholders(text), params))
}

// Mirrors the mysql2 pool.getConnection() transaction helpers.
async function getConnection() {
    const client = await pool.connect()
    return {
        query: async (text, params = []) => shape(await client.query(toPgPlaceholders(text), params)),
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
    }
}

export function hashFlag(flag) {
    return crypto.createHash('sha256').update(String(flag)).digest('hex')
}

export { query, getConnection }
export default { query, getConnection }
