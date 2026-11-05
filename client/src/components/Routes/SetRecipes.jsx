import { useCallback, useEffect, useState } from 'react'
import Footer from '../Footer'
import HeaderCareGiver from '../HeaderCareGiver'
import PageHeading from '../PageHeading'
import api from '../../api'
import { splitSteps } from '../../utils/date'

function SetRecipes() {
    const [title, setTitle] = useState('')
    const [tasks, setTasks] = useState('')
    const [routines, setRoutines] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadRoutines = useCallback(async () => {
        try {
            const { data } = await api.get('/tasks')
            setRoutines(data)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load routines. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRoutines()
    }, [loadRoutines])

    const resetForm = () => {
        setTitle('')
        setTasks('')
        setEditingId(null)
    }

    const handleSetTask = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        setSaving(true)
        try {
            if (editingId) {
                const { data } = await api.patch(`/tasks/${editingId}`, { title, tasks })
                setRoutines((current) => current.map((item) => (item._id === editingId ? { ...item, ...data } : item)))
                setMessage('Routine updated.')
            } else {
                const { data } = await api.post('/tasks', { title, tasks })
                setRoutines((current) => [data, ...current])
                setMessage('Routine saved for your loved one.')
            }
            resetForm()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save this routine. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const startEditing = (routine) => {
        setEditingId(routine._id)
        setTitle(routine.title)
        setTasks(routine.tasks)
        setMessage('')
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        window.setTimeout(() => document.getElementById('title')?.focus(), 250)
    }

    const removeRoutine = async (routine) => {
        if (!window.confirm(`Remove the routine “${routine.title}”? This cannot be undone.`)) return
        setDeletingId(routine._id)
        setMessage('')
        setError('')
        try {
            await api.delete(`/tasks/${routine._id}`)
            setRoutines((current) => current.filter((item) => item._id !== routine._id))
            if (editingId === routine._id) resetForm()
            setMessage('Routine removed.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to remove this routine. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading
                    eyebrow="Familiar steps, made simple"
                    title={editingId ? 'Edit routine' : 'Create a routine'}
                    description="Break a daily activity into clear, manageable steps."
                />
                <section className="app-panel form-panel">
                    <div className="form-panel__intro">
                        <span className="form-panel__icon" aria-hidden="true">☷</span>
                        <div>
                            <h2>{editingId ? 'Update these steps' : 'Make each step feel familiar'}</h2>
                            <p>Write one simple action per line, in the order it happens.</p>
                        </div>
                    </div>
                    <form className="app-form" onSubmit={handleSetTask}>
                        <label htmlFor="title">Routine name</label>
                        <input type="text" id="title" value={title} onChange={(event) => setTitle(event.target.value)}
                            maxLength={100} required className="app-input" placeholder="Getting ready for the day" />

                        <label htmlFor="orderedTasks">Steps <span className="label-hint">One step per line</span></label>
                        <textarea id="orderedTasks" value={tasks} onChange={(event) => setTasks(event.target.value)}
                            maxLength={2000} required rows={6} className="app-input app-textarea"
                            placeholder={"Wash hands\nBrush teeth\nGet dressed"} />

                        <div className="form-actions">
                            <button type="submit" disabled={saving} className="app-button app-button--primary">
                                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save routine'}
                            </button>
                            {editingId && (
                                <button type="button" className="app-button app-button--secondary" onClick={resetForm} disabled={saving}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                    {message && <p role="status" className="form-message form-message--success">{message}</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                </section>

                <section className="manage-section">
                    <div className="care-notes-list__heading">
                        <div>
                            <span className="page-heading__eyebrow">CURRENT ROUTINES</span>
                            <h2>{routines.length} routine{routines.length === 1 ? '' : 's'} shared</h2>
                        </div>
                        <button type="button" className="app-button app-button--secondary" onClick={loadRoutines} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {loading && <p role="status" className="app-empty">Loading routines...</p>}
                    {!loading && routines.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">☷</span>
                            <h2>No routines yet</h2>
                            <p>Create your first routine above to give familiar activities a clear, calm structure.</p>
                        </div>
                    )}

                    <ul className="manage-list">
                        {routines.map((routine) => (
                            <li className={`manage-item manage-item--stacked${editingId === routine._id ? ' manage-item--editing' : ''}`} key={routine._id}>
                                <div className="manage-item__body">
                                    <h3>{routine.title}</h3>
                                    <ol className="manage-item__steps">
                                        {splitSteps(routine.tasks).map((step, index) => (
                                            <li key={`${routine._id}-${index}`}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                                <div className="manage-item__actions">
                                    <button type="button" className="app-button app-button--secondary" onClick={() => startEditing(routine)}>
                                        Edit
                                    </button>
                                    <button type="button" className="app-button app-button--danger" onClick={() => removeRoutine(routine)} disabled={deletingId === routine._id}>
                                        {deletingId === routine._id ? 'Removing…' : 'Remove'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default SetRecipes
