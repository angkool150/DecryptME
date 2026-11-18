export const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,31}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8

export function usernameError(username) {
    return USERNAME_RE.test(String(username ?? ''))
        ? ''
        : 'Username must be 3-32 characters (letters, numbers, _, ., -).'
}

export function emailError(email) {
    return EMAIL_RE.test(String(email ?? '')) ? '' : 'Enter a valid email address.'
}

export function passwordError(password, confirm) {
    if (String(password ?? '').length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    }
    if (password !== confirm) return 'Passwords do not match.'
    return ''
}
