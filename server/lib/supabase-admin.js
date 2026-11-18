// server/lib/supabase-admin.js
// Supabase admin client (server-only). Used for verifying user access tokens,
// creating users for email verification, and storage operations share the same
// project credentials.

import { createClient } from '@supabase/supabase-js'

let admin = null

function getSupabaseServerConfig() {
    const url = process.env.SUPABASE_URL
    const key =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY
    return url && key ? { url, key } : null
}

export function getSupabaseAdmin() {
    if (admin) return admin

    const config = getSupabaseServerConfig()
    if (!config) return null

    admin = createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    return admin
}

export function isSupabaseAdminConfigured() {
    return Boolean(getSupabaseAdmin())
}

export async function getSupabaseUserFromAccessToken(accessToken) {
    const client = getSupabaseAdmin()
    if (!client) return { error: 'Supabase admin is not configured.' }
    if (!accessToken || typeof accessToken !== 'string') return { error: 'Missing access token.' }

    const { data, error } = await client.auth.getUser(accessToken)
    if (error || !data?.user) return { error: error?.message || 'Invalid Supabase session.' }
    return { user: data.user }
}
