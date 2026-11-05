let audioContext = null

/**
 * Plays a short, gentle three-note chime. Called only from a user gesture the
 * first time so browsers allow audio; afterwards it can play for due reminders.
 */
export function playChime() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) return
        if (!audioContext) audioContext = new AudioContextClass()
        if (audioContext.state === 'suspended') audioContext.resume()

        const start = audioContext.currentTime
        const notes = [523.25, 659.25, 783.99]

        notes.forEach((frequency, index) => {
            const offset = start + index * 0.22
            const oscillator = audioContext.createOscillator()
            const gain = audioContext.createGain()

            oscillator.type = 'sine'
            oscillator.frequency.value = frequency

            gain.gain.setValueAtTime(0.0001, offset)
            gain.gain.exponentialRampToValueAtTime(0.16, offset + 0.04)
            gain.gain.exponentialRampToValueAtTime(0.0001, offset + 0.9)

            oscillator.connect(gain)
            gain.connect(audioContext.destination)
            oscillator.start(offset)
            oscillator.stop(offset + 1)
        })
    } catch {
        // Audio is a nice-to-have; the visual reminder is always shown.
    }
}
