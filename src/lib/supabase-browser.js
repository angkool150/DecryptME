'use client'

import { createClient } from '@supabase/supabase-js'

let client = null

function getSupabaseBrowserConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && key ? { url, key } : null
}

export function getSupabaseBrowser() {
    if (client) return client

    const config = getSupabaseBrowserConfig()
    if (!config) return null

    client = createClient(config.url, config.key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })

    return client
}

export function isSupabaseAuthConfigured() {
    return Boolean(getSupabaseBrowserConfig())
}
