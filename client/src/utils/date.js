export function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function minutesIntoDay(time) {
    const [hours, minutes] = String(time || '00:00').split(':').map(Number)
    return hours * 60 + minutes
}

export function formatReminderTime(time) {
    const [hours, minutes] = String(time || '00:00').split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function relativeTime(value) {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
    if (seconds < 60) return 'just now'
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.round(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

export function splitSteps(tasks) {
    return String(tasks || '').split(/\r?\n/).map((step) => step.trim()).filter(Boolean)
}
