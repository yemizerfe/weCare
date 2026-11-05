import { useCallback, useEffect, useRef, useState } from 'react'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api, { apiAssetUrl } from '../../api'

function SetMemoryAlbum() {
    const [image, setImage] = useState(null)
    const [description, setDescription] = useState('')
    const [albums, setAlbums] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [editingDescription, setEditingDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const loadAlbums = useCallback(async () => {
        try {
            const { data } = await api.get('/albums')
            setAlbums(data)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load the memory album. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadAlbums()
    }, [loadAlbums])

    const handleSetAlbum = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')
        if (!image) {
            setError('Choose a photo to add to the memory album.')
            return
        }
        setSaving(true)
        try {
            const formData = new FormData()
            formData.append('image', image)
            formData.append('description', description)
            await api.post('/albums', formData)
            setMessage('Memory added to the shared album.')
            setImage(null)
            setDescription('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            await loadAlbums()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save this memory. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const startEditing = (album) => {
        setEditingId(album._id)
        setEditingDescription(album.description)
        setMessage('')
        setError('')
    }

    const saveCaption = async (id) => {
        setError('')
        setMessage('')
        try {
            const { data } = await api.patch(`/albums/${id}`, { description: editingDescription })
            setAlbums((current) => current.map((album) => (
                album._id === id ? { ...album, description: data.description } : album
            )))
            setEditingId(null)
            setEditingDescription('')
            setMessage('Caption updated.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to update this caption. Please try again.')
        }
    }

    const removeAlbum = async (album) => {
        if (!window.confirm('Remove this photo from the memory album? This cannot be undone.')) return
        setDeletingId(album._id)
        setError('')
        setMessage('')
        try {
            await api.delete(`/albums/${album._id}`)
            setAlbums((current) => current.filter((entry) => entry._id !== album._id))
            if (editingId === album._id) setEditingId(null)
            setMessage('Memory removed.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to remove this memory. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading eyebrow="Keep the stories close" title="Add a memory" description="Share a photo and a few words to make your loved one’s album feel personal." />
                <section className="app-panel form-panel">
                    <div className="form-panel__intro">
                        <span className="form-panel__icon" aria-hidden="true">▧</span>
                        <div>
                            <h2>Every picture has a story</h2>
                            <p>Add a favorite photo and a note they’ll recognize. JPG, PNG, WEBP, or GIF up to 5 MB.</p>
                        </div>
                    </div>
                    <form className="app-form" onSubmit={handleSetAlbum}>
                        <label htmlFor="image">Choose a photo</label>
                        <input ref={fileInputRef} type="file" id="image" name="image" accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(event) => setImage(event.target.files?.[0] || null)} required className="app-input app-input--file" />
                        {image && <p className="file-selected">Selected: {image.name}</p>}

                        <label htmlFor="description">Add a caption or memory</label>
                        <textarea id="description" name="description" value={description} maxLength={240} required
                            onChange={(event) => setDescription(event.target.value)} className="app-input app-textarea"
                            placeholder="Who is in this photo? What do you remember about this day?" />
                        <p className="label-hint">{description.length}/240 characters</p>

                        <button type="submit" className="app-button app-button--primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Add to memory album'}
                        </button>
                    </form>
                    {message && <p role="status" className="form-message form-message--success">{message}</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                </section>

                <section className="manage-section">
                    <div className="care-notes-list__heading">
                        <div>
                            <span className="page-heading__eyebrow">SHARED MEMORIES</span>
                            <h2>{albums.length} photo{albums.length === 1 ? '' : 's'} in the album</h2>
                        </div>
                        <button type="button" className="app-button app-button--secondary" onClick={loadAlbums} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {loading && <p role="status" className="app-empty">Opening the album...</p>}
                    {!loading && albums.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">▧</span>
                            <h2>The album is ready for memories</h2>
                            <p>Add a photo above and your loved one will see it in their memory album.</p>
                        </div>
                    )}

                    <div className="album-manage-grid">
                        {albums.map((album) => (
                            <article className="album-manage-card" key={album._id}>
                                <img src={apiAssetUrl(album.imageUrl)} alt={album.description} loading="lazy" />
                                <div className="album-manage-card__body">
                                    {editingId === album._id ? (
                                        <>
                                            <label className="sr-only" htmlFor={`caption-${album._id}`}>Caption</label>
                                            <textarea
                                                id={`caption-${album._id}`}
                                                value={editingDescription}
                                                onChange={(event) => setEditingDescription(event.target.value)}
                                                maxLength={240}
                                                rows={3}
                                                className="app-input app-textarea"
                                            />
                                            <div className="manage-item__actions">
                                                <button type="button" className="app-button app-button--primary" onClick={() => saveCaption(album._id)}>Save caption</button>
                                                <button type="button" className="app-button app-button--secondary" onClick={() => setEditingId(null)}>Cancel</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p>{album.description}</p>
                                            <div className="manage-item__actions">
                                                <button type="button" className="app-button app-button--secondary" onClick={() => startEditing(album)}>Edit caption</button>
                                                <button type="button" className="app-button app-button--danger" onClick={() => removeAlbum(album)} disabled={deletingId === album._id}>
                                                    {deletingId === album._id ? 'Removing…' : 'Remove'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default SetMemoryAlbum
