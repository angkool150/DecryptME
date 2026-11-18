export function parseStepContent(content) {
    try {
        return JSON.parse(content)
    } catch {
        return { text: content }
    }
}
