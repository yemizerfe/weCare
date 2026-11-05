import { useEffect, useState } from 'react'

const sizes = [
    { value: 'normal', label: 'Standard text' },
    { value: 'large', label: 'Larger text' },
    { value: 'xlarge', label: 'Largest text' },
]
const storageKey = 'wecare:text-scale'

function readInitialSize() {
    try {
        const saved = window.localStorage.getItem(storageKey)
        if (sizes.some((size) => size.value === saved)) return saved
    } catch {
        // Ignore unavailable storage.
    }
    return 'normal'
}

function TextSizeControl() {
    const [size, setSize] = useState(readInitialSize)

    useEffect(() => {
        document.documentElement.dataset.textScale = size
        try {
            window.localStorage.setItem(storageKey, size)
        } catch {
            // The preference simply will not persist.
        }
    }, [size])

    const cycle = () => {
        setSize((currentSize) => {
            const index = sizes.findIndex((entry) => entry.value === currentSize)
            return sizes[(index + 1) % sizes.length].value
        })
    }

    const current = sizes.find((entry) => entry.value === size) || sizes[0]

    return (
        <button
            type="button"
            className="text-size-control"
            onClick={cycle}
            aria-label={`${current.label}. Change text size.`}
            title={`${current.label} — click to change`}
        >
            <span aria-hidden="true">A<sup>+</sup></span>
            <span className="text-size-control__label">Text size</span>
        </button>
    )
}

export default TextSizeControl
