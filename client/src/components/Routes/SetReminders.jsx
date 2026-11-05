import { useCallback, useEffect, useState } from 'react'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'
import { formatReminderTime } from '../../utils/date'

function SetReminders() {
    const [time, setTime] = useState('')
    const [reminder, setReminder] = useState('')
    const [reminders, setReminders] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadReminders = useCallback(async () => {
        try {
            const { data } = await api.get('/reminders')
            setReminders(data)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load reminders. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadReminders()
    }, [loadReminders])

    const resetForm = () => {
        setTime('')
        setReminder('')
        setEditingId(null)
    }

    const handleSetReminder = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')
        setSaving(true)
        try {
            if (editingId) {
                const { data } = await api.patch(`/reminders/${editingId}`, { time, reminder })
                setReminders((current) => current.map((item) => (item._id === editingId ? { ...item, ...data } : item)))
                setMessage('Reminder updated.')
            } else {
                const { data } = await api.post('/reminders', { time, reminder })
                setReminders((current) => [...current, data])
                setMessage('Reminder saved. It will appear on your loved one’s plan every day.')
            }
            resetForm()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save this reminder. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const startEditing = (item) => {
        setEditingId(item._id)
        setTime(item.time)
        setReminder(item.reminder)
        setMessage('')
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        window.setTimeout(() => document.getElementById('reminderTime')?.focus(), 250)
    }

    const removeReminder = async (item) => {
        if (!window.confirm(`Remove the reminder “${item.reminder}”? This cannot be undone.`)) return
        setDeletingId(item._id)
        setError('')
        setMessage('')
        try {
            await api.delete(`/reminders/${item._id}`)
            setReminders((current) => current.filter((entry) => entry._id !== item._id))
            if (editingId === item._id) resetForm()
            setMessage('Reminder removed.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to remove this reminder. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    const sorted = [...reminders].sort((left, right) => left.time.localeCompare(right.time))

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading eyebrow="A thoughtful nudge" title={editingId ? 'Edit reminder' : 'Set a reminder'} description="Add a gentle prompt to support a familiar daily routine." />
                <section className="app-panel form-panel">
                    <div className="form-panel__intro">
                        <span className="form-panel__icon" aria-hidden="true">◷</span>
                        <div>
                            <h2>{editingId ? 'Update this reminder' : 'Make the day feel easier'}</h2>
                            <p>Choose a time and write a short, clear reminder. Reminders repeat every day.</p>
                        </div>
                    </div>
                    <form className="app-form" onSubmit={handleSetReminder}>
                        <label htmlFor="reminderTime">Time</label>
                        <input type="time" id="reminderTime" name="time" value={time} required
                            onChange={(event) => setTime(event.target.value)} className="app-input" />

                        <label htmlFor="reminderText">What should they remember?</label>
                        <input type="text" id="reminderText" name="reminder" value={reminder} maxLength={240} required
                            onChange={(event) => setReminder(event.target.value)} className="app-input"
                            placeholder="For example: Take your morning medication" />

                        <div className="form-actions">
                            <button type="submit" className="app-button app-button--primary" disabled={saving}>
                                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save reminder'}
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
                            <span className="page-heading__eyebrow">CURRENT REMINDERS</span>
                            <h2>{reminders.length} reminder{reminders.length === 1 ? '' : 's'} each day</h2>
                        </div>
                        <button type="button" className="app-button app-button--secondary" onClick={loadReminders} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {loading && <p role="status" className="app-empty">Loading reminders...</p>}
                    {!loading && sorted.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">◷</span>
                            <h2>No reminders yet</h2>
                            <p>Add your first reminder above. It will appear on your loved one’s daily plan.</p>
                        </div>
                    )}

                    <ul className="manage-list">
                        {sorted.map((item) => (
                            <li className={`manage-item${editingId === item._id ? ' manage-item--editing' : ''}`} key={item._id}>
                                <time className="manage-item__time" dateTime={item.time}>{formatReminderTime(item.time)}</time>
                                <span className="manage-item__text">{item.reminder}</span>
                                <div className="manage-item__actions">
                                    <button type="button" className="app-button app-button--secondary" onClick={() => startEditing(item)}>
                                        Edit
                                    </button>
                                    <button type="button" className="app-button app-button--danger" onClick={() => removeReminder(item)} disabled={deletingId === item._id}>
                                        {deletingId === item._id ? 'Removing…' : 'Remove'}
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

export default SetReminders
