import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'
import { formatReminderTime, minutesIntoDay } from '../../utils/date'

function SeeReminder() {
    const [reminders, setReminders] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [now, setNow] = useState(() => new Date())

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

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000)
        return () => window.clearInterval(timer)
    }, [])

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const nextReminder = [...reminders]
        .sort((left, right) => left.time.localeCompare(right.time))
        .find((item) => minutesIntoDay(item.time) >= nowMinutes)

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading eyebrow="Your day, at your pace" title="Today’s reminders" description="A little nudge for the things you want to remember.">
                    <button type="button" className="app-button app-button--secondary" onClick={loadReminders} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                </PageHeading>

                {nextReminder && (
                    <section className="up-next-card up-next-card--compact" aria-live="polite">
                        <div className="up-next-card__icon" aria-hidden="true">◷</div>
                        <div className="up-next-card__body">
                            <span className="page-heading__eyebrow">COMING UP</span>
                            <h2>{nextReminder.reminder}</h2>
                            <p>At {formatReminderTime(nextReminder.time)}.</p>
                        </div>
                        <Link to="/today" className="app-button app-button--primary">Open my day</Link>
                    </section>
                )}

                <section className="app-panel reminder-panel" aria-live="polite">
                    {loading && <p role="status" className="app-empty">Loading your reminders...</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    {!loading && !error && reminders.length === 0 && (
                        <div className="app-empty">
                            <span className="empty-icon" aria-hidden="true">◷</span>
                            <h2>Nothing on your list just yet</h2>
                            <p>Your caregiver can add reminders here whenever you need them.</p>
                        </div>
                    )}
                    {reminders.length > 0 && (
                        <ul className="reminder-list">
                            {[...reminders].sort((left, right) => left.time.localeCompare(right.time)).map((item) => {
                                const minutes = minutesIntoDay(item.time)
                                const isPast = minutes < nowMinutes
                                return (
                                    <li key={item._id} className={`reminder-item${isPast ? ' reminder-item--past' : ''}`}>
                                        <time className="reminder-item__time" dateTime={item.time}>{formatReminderTime(item.time)}</time>
                                        <span className="reminder-item__bullet" aria-hidden="true" />
                                        <span className="reminder-item__text">{item.reminder}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
                <p className="daily-plan-footnote">
                    Check things off and save your progress in <Link to="/today">My day</Link>.
                </p>
            </main>
            <Footer />
        </div>
    )
}

export default SeeReminder
