// server/lib/storage.js
// Supabase Storage helpers for challenge attachments and profile pictures.
//
// The `Files` bucket is private, so the API never exposes raw object keys to
// the browser. Attachments are stored in the database as object keys
// ("Challenges/<file>") and converted to short-lived signed URLs when they are
// read. Signed URLs are cached in memory until shortly before they expire.

import { getSupabaseAdmin } from './supabase-admin.js'

const BUCKET = process.env.SUPABASE_BUCKET || 'Files'
const SIGNED_URL_TTL = Number(process.env.SUPABASE_SIGNED_URL_TTL) || 60 * 60
const CACHE_SAFETY_MS = 5 * 60 * 1000

let warned = false

function getClient() {
    const client = getSupabaseAdmin()
    if (!client && !warned) {
        warned = true
        console.warn('[storage] SUPABASE_URL / SUPABASE_SECRET_KEY are not set; file storage is disabled.')
    }
    return client
}

export function isStorageConfigured() {
    return Boolean(getClient())
}

// A stored attachment is either a legacy path ("/assets/x.png") or an object
// key ("Challenges/x.png"). Anything absolute or starting with "/" is legacy.
export function isStorageKey(value) {
    const key = String(value ?? '').trim()
    if (!key) return false
    return !key.startsWith('/') && !/^[a-z][a-z0-9+.-]*:\/\//i.test(key)
}

const signedUrlCache = new Map()

function cacheId(key, downloadName) {
    return downloadName ? `dl:${downloadName}:${key}` : `in:${key}`
}

function fileNameForKey(key) {
    const name = String(key || '').split('/').pop() || 'download'
    try {
        return decodeURIComponent(name)
    } catch {
        return name
    }
}

export async function signStorageKeys(keys, { download = false } = {}) {
    const unique = [...new Set(keys.filter(isStorageKey))]
    const signed = new Map()
    if (!unique.length) return signed

    const supabase = getClient()
    const now = Date.now()
    const missing = []

    // Warm serverless instances can live for a long time; drop expired entries
    // before the cache grows without bound.
    if (signedUrlCache.size > 500) {
        for (const [id, entry] of signedUrlCache) {
            if (entry.expiresAt <= now) signedUrlCache.delete(id)
        }
    }

    for (const key of unique) {
        const downloadName = download ? fileNameForKey(key) : null
        const id = cacheId(key, downloadName)
        const cached = signedUrlCache.get(id)
        if (cached && cached.expiresAt > now) signed.set(key, cached.url)
        else missing.push({ key, downloadName, id })
    }

    if (!missing.length || !supabase) return signed

    await Promise.all(
        missing.map(async ({ key, downloadName, id }) => {
            try {
                const options = downloadName ? { download: downloadName } : undefined
                const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, SIGNED_URL_TTL, options)
                if (error || !data?.signedUrl) return
                signed.set(key, data.signedUrl)
                signedUrlCache.set(id, {
                    url: data.signedUrl,
                    expiresAt: now + SIGNED_URL_TTL * 1000 - CACHE_SAFETY_MS,
                })
            } catch (err) {
                console.error('[storage] could not sign URL:', key, err?.message || err)
            }
        })
    )

    return signed
}

export async function signStorageKey(key, options) {
    const signed = await signStorageKeys([key], options)
    return signed.get(key) ?? null
}

// Replace storage keys with signed URLs on one row or an array of rows.
export async function withSignedUrls(rows, field = 'attachment_url', options) {
    const list = Array.isArray(rows) ? rows : [rows]
    const keys = list.map((row) => row?.[field]).filter(isStorageKey)
    if (!keys.length) return rows

    const signed = await signStorageKeys(keys, options)

    for (const row of list) {
        const key = row?.[field]
        if (!isStorageKey(key)) continue

        const url = signed.get(key)
        if (url) row[field] = url
        else row[field] = null
    }

    return rows
}

// Accepts a value posted by the admin UI and returns the object key that should
// be stored. Signed/public Supabase URLs are reduced back to their key so a
// page reload cannot persist an expiring URL into the database.
export function normalizeStorageInput(value) {
    const input = String(value ?? '').trim()
    if (!input) return null

    const match = input.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?.*)?$/)
    if (match) {
        try {
            return decodeURIComponent(match[2])
        } catch {
            return match[2]
        }
    }

    return input
}

export async function deleteStorageObject(key) {
    if (!isStorageKey(key)) return false

    const supabase = getClient()
    if (!supabase) return false

    try {
        const { error } = await supabase.storage.from(BUCKET).remove([key])
        if (error) {
            console.error('[storage] could not delete object:', key, error.message || error)
            return false
        }
        return true
    } catch (err) {
        console.error('[storage] could not delete object:', key, err?.message || err)
        return false
    }
}

export async function uploadStorageObject(key, body, contentType) {
    const supabase = getClient()
    if (!supabase) {
        const err = new Error(
            'File storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.'
        )
        err.code = 'STORAGE_NOT_CONFIGURED'
        throw err
    }

    const { error } = await supabase.storage.from(BUCKET).upload(key, body, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
    })

    if (error) throw error

    signedUrlCache.delete(cacheId(key, null))
    return key
}

export { BUCKET }
