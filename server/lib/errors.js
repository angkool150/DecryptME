export function serverError(res, err, label, message = 'Server error.') {
    console.error(label, err)
    return res.status(500).json({ error: message })
}
