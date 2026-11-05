import { useCallback, useEffect, useState } from 'react'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api, { apiAssetUrl } from '../../api'

function SeeMemoryAlbum() {
    const [photos, setPhotos] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(null)

    const loadPhotos = useCallback(async () => {
        try {
            const { data } = await api.get('/albums')
            setPhotos(data)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load your memories. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPhotos()
    }, [loadPhotos])

    useEffect(() => {
        if (activeIndex === null) return undefined
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setActiveIndex(null)
            if (event.key === 'ArrowRight') setActiveIndex((index) => (index + 1) % photos.length)
            if (event.key === 'ArrowLeft') setActiveIndex((index) => (index - 1 + photos.length) % photos.length)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [activeIndex, photos.length])

    const activePhoto = activeIndex === null ? null : photos[activeIndex]

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading eyebrow="A place for your favorite moments" title="Memory album" description="Photos and familiar stories, gathered in one lovely place.">
                    <button type="button" className="app-button app-button--secondary" onClick={loadPhotos} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh album'}
                    </button>
                </PageHeading>

                <section className="memory-grid" aria-live="polite">
                    {loading && <p role="status" className="app-empty">Opening your album...</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    {!loading && !error && photos.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">▧</span>
                            <h2>Your album is ready for memories</h2>
                            <p>Your caregiver can add special photos and the stories behind them.</p>
                        </div>
                    )}
                    {!error && photos.map((photo, index) => (
                        <button
                            type="button"
                            className="memory-card"
                            key={photo._id}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Open photo: ${photo.description}`}
                        >
                            <span className="memory-card__image-wrap">
                                <img src={apiAssetUrl(photo.imageUrl)} alt="" loading="lazy" />
                            </span>
                            <span className="memory-card__caption">{photo.description}</span>
                            <span className="memory-card__hint">Tap to see it larger <span aria-hidden="true">↗</span></span>
                        </button>
                    ))}
                </section>

                {activePhoto && (
                    <div
                        className="photo-viewer"
                        role="dialog"
                        aria-modal="true"
                        aria-label={activePhoto.description}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setActiveIndex(null)
                        }}
                    >
                        <div className="photo-viewer__panel">
                            <button type="button" className="photo-viewer__close" onClick={() => setActiveIndex(null)} aria-label="Close photo">
                                ×
                            </button>
                            <img src={apiAssetUrl(activePhoto.imageUrl)} alt={activePhoto.description} />
                            <p>{activePhoto.description}</p>
                            {photos.length > 1 && (
                                <div className="photo-viewer__nav">
                                    <button type="button" className="app-button app-button--secondary" onClick={() => setActiveIndex((activeIndex - 1 + photos.length) % photos.length)}>
                                        ← Previous
                                    </button>
                                    <span>{activeIndex + 1} of {photos.length}</span>
                                    <button type="button" className="app-button app-button--secondary" onClick={() => setActiveIndex((activeIndex + 1) % photos.length)}>
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default SeeMemoryAlbum
