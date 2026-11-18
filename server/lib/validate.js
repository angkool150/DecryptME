// server/lib/validate.js
// Strict input validation for auth endpoints. All database access uses
// parameterized queries; these checks limit input shape/size and reject
// obviously malformed values before they reach business logic.

import { EMAIL_RE, PASSWORD_MIN_LENGTH, USERNAME_RE } from '../../src/lib/validation.js'

export function asTrimmedString(value, max = 255) {
    if (value == null) return ''
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, max)
}

export function validateUsername(value) {
    const username = asTrimmedString(value, 32)
    if (!username) return { error: 'Username is required.' }
    if (!USERNAME_RE.test(username)) {
        return {
            error: 'Username must be 3-32 characters and use only letters, numbers, underscores, dots, or hyphens.',
        }
    }
    return { value: username }
}

export function validateEmail(value) {
    const email = asTrimmedString(value, 254).toLowerCase()
    if (!email) return { error: 'Email is required.' }
    if (!EMAIL_RE.test(email) || email.length < 5) return { error: 'Enter a valid email address.' }
    return { value: email }
}

export function validatePassword(value, { min = PASSWORD_MIN_LENGTH, max = 128 } = {}) {
    if (typeof value !== 'string') return { error: 'Password is required.' }
    if (value.length < min) return { error: `Password must be at least ${min} characters.` }
    if (value.length > max) return { error: 'Password is too long.' }
    return { value }
}

export function validateLoginIdentifier(value) {
    const identifier = asTrimmedString(value, 254)
    if (!identifier) return { error: 'Username or email is required.' }
    if (identifier.length < 3) return { error: 'Invalid username or email.' }
    return { value: identifier }
}
