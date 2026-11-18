export function ViewLoading({ message, className = '' }) {
    return (
        <div className={`flex items-center justify-center font-mono text-neon/75 ${className}`}>
            {message}
        </div>
    )
}

export function ViewError({ message, className = '' }) {
    return (
        <div className={`rounded-xl border border-red-400/20 bg-red-400/10 p-4 font-mono text-sm text-red-300 ${className}`}>
            {message}
        </div>
    )
}
