export const PRESENCE_ACTIVITY = {
    '/': 'Viewing dashboard',
    '/challenges': 'Solving challenges',
    '/leaderboard': 'Checking leaderboard',
    '/profile': 'Viewing profile',
    '/admin': 'Using admin console',
    '/login': 'Signing in',
}

const ROUTE_PREFIXES = ['/admin', '/challenges', '/leaderboard', '/profile']

export function activityForPath(pathname = '/') {
    const match = ROUTE_PREFIXES.find((prefix) => pathname.startsWith(prefix))
    return match ? PRESENCE_ACTIVITY[match] : PRESENCE_ACTIVITY['/']
}
