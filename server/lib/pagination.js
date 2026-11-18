export function parsePagination(query = {}, { defaultLimit = 25, maxLimit = 100 } = {}) {
    const requestedLimit = Number(query.limit)
    const requestedOffset = Number(query.offset)
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : defaultLimit, 1), maxLimit)
    const offset = Math.max(Number.isFinite(requestedOffset) ? requestedOffset : 0, 0)
    return { limit, offset }
}
