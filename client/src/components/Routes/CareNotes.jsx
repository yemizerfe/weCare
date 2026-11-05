import { useCallback, useEffect, useState } from 'react'
import HeaderPatient from '../HeaderPatient'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'

const categories = {
    handoff: { label: 'Care update', icon: '↗' },
    preference: { label: 'What works well', icon: '♡' },
    conversation: { label: 'Conversation idea', icon: '✳' },
}

function CareNotes({ canManage = false }) {
    const [notes, setNotes] = useState([])
    const [title, setTitle] = useState('')
    const [note, setNote] = useState('')
    const [category, setCategory] = useState('handoff')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const loadNotes = useCallback(async () => {
        setError('')
        setLoading(true)
        try {
            const { data } = await api.get('/care-notes')
            setNotes(data)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load care notes. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    const saveNote = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')
        setSaving(true)
        try {
            const { data } = await api.post('/care-notes', { title, note, category })
            setNotes((current) => [data, ...current])
            setTitle('')
            setNote('')
            setMessage('Your care note has been shared.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save this note. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const removeNote = async (id) => {
        if (!window.confirm('Remove this shared care note? This cannot be undone.')) return
        setError('')
        try {
            await api.delete(`/care-notes/${id}`)
            setNotes((current) => current.filter((entry) => entry._id !== id))
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to remove this note. Please try again.')
        }
    }

    return (
        <div className="app-page">
            {canManage ? <HeaderCareGiver /> : <HeaderPatient />}
            <main className="app-main">
                <PageHeading
                    eyebrow={canManage ? 'Keep your care circle in sync' : 'A shared space for the people who care'}
                    title="Care notes"
                    description={canManage
                        ? 'Capture helpful context, personal preferences, and small wins for your care circle.'
                        : 'Helpful updates and familiar preferences shared by your caregiver.'}
                />

                {canManage && (
                    <section className="app-panel care-note-editor">
                        <div className="form-panel__intro">
                            <span className="form-panel__icon" aria-hidden="true">✎</span>
                            <div>
                                <h2>Share something helpful</h2>
                                <p>Keep notes practical, respectful, and useful to the people supporting care.</p>
                            </div>
                        </div>
                        <form className="app-form" onSubmit={saveNote}>
                            <label htmlFor="care-note-category">Note type</label>
                            <select id="care-note-category" value={category} onChange={(event) => setCategory(event.target.value)} className="app-input">
                                <option value="handoff">Care update</option>
                                <option value="preference">What works well</option>
                                <option value="conversation">Conversation idea</option>
                            </select>

                            <label htmlFor="care-note-title">Short title</label>
                            <input id="care-note-title" value={title} onChange={(event) => setTitle(event.target.value)}
                                maxLength={100} minLength={2} required className="app-input" placeholder="A calm start to the morning" />

                            <label htmlFor="care-note-body">Note</label>
                            <textarea id="care-note-body" value={note} onChange={(event) => setNote(event.target.value)}
                                maxLength={1000} required rows={4} className="app-input app-textarea"
                                placeholder="Share a helpful observation, preference, or conversation idea." />
                            <div className="care-note-editor__footer">
                                <span>{note.length}/1,000 characters</span>
                                <button type="submit" className="app-button app-button--primary" disabled={saving}>
                                    {saving ? 'Sharing…' : 'Share with care circle'} <span aria-hidden="true">↗</span>
                                </button>
                            </div>
                        </form>
                        {message && <p role="status" className="form-message form-message--success">{message}</p>}
                    </section>
                )}

                <section className={`care-notes-list${canManage ? ' care-notes-list--manage' : ''}`} aria-live="polite">
                    <div className="care-notes-list__heading">
                        <div>
                            <span className="page-heading__eyebrow">SHARED WITH YOUR CARE CIRCLE</span>
                            <h2>{canManage ? 'Recent notes' : 'Your shared notes'}</h2>
                        </div>
                        <button type="button" className="app-button app-button--secondary" onClick={loadNotes} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    {loading && <p role="status" className="app-empty">Loading shared care notes...</p>}
                    {!loading && !error && notes.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">♡</span>
                            <h2>No notes shared yet</h2>
                            <p>{canManage ? 'Add a helpful update or preference above to keep everyone in the loop.' : 'Your caregiver can share a helpful update or preference here.'}</p>
                        </div>
                    )}
                    <div className="care-note-grid">
                        {notes.map((entry) => {
                            const type = categories[entry.category]
                            return (
                                <article className="care-note-card" key={entry._id}>
                                    <div className="care-note-card__top">
                                        <span className={`care-note-card__badge care-note-card__badge--${entry.category}`}>
                                            <span aria-hidden="true">{type?.icon || '♡'}</span> {type?.label || 'Care note'}
                                        </span>
                                        {canManage && (
                                            <button type="button" className="care-note-card__delete"
                                                onClick={() => removeNote(entry._id)} aria-label={`Delete ${entry.title}`}>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <h3>{entry.title}</h3>
                                    <p>{entry.note}</p>
                                    <time dateTime={entry.createdAt}>
                                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </time>
                                </article>
                            )
                        })}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default CareNotes
