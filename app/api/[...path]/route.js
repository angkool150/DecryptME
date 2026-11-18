import { handleApiRequest } from '@/lib/server/apiAdapter.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handler(request) {
    return handleApiRequest(request)
}

export {
    handler as GET,
    handler as POST,
    handler as PUT,
    handler as PATCH,
    handler as DELETE,
    handler as OPTIONS,
    handler as HEAD,
}
