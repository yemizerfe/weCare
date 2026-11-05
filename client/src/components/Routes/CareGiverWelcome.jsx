import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PatientFeatures from '../PatientFeatures'
import CaregiverSection from '../caregiverSection'
import Footer from '../Footer'
import CareGiverVideo from '../../assets/Videos/withvi3.mp4'
import careGiverVid from '../../assets/Videos/withapp2.mp4'
import HeaderCareGiver from '../HeaderCareGiver'
import PageHeading from '../PageHeading'
import api from '../../api'
import { formatReminderTime, getLocalDateKey, minutesIntoDay, relativeTime, splitSteps } from '../../utils/date'

function CareGiverWelcome() {
    const [profile, setProfile] = useState(null)
    const [patients, setPatients] = useState([])
    const [reminders, setReminders] = useState([])
    const [routines, setRoutines] = useState([])
    const [noteCount, setNoteCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState('')
    const [today, setToday] = useState(() => new Date())
    const dateKey = getLocalDateKey(today)

    const loadDashboard = useCallback(async () => {
        try {
            const [me, patientsResponse, reminderResponse, routineResponse, noteResponse] = await Promise.all([
                api.get('/auth/me'),
                api.get(`/patients?date=${dateKey}`),
                api.get('/reminders'),
                api.get('/tasks'),
                api.get('/care-notes'),
            ])
            setProfile(me.data.user)
            setPatients(patientsResponse.data)
            setReminders(reminderResponse.data)
            setRoutines(routineResponse.data)
            setNoteCount(noteResponse.data.length)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load your dashboard. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [dateKey])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    useEffect(() => {
        const clock = window.setInterval(() => setToday(new Date()), 30_000)
        const refresh = window.setInterval(loadDashboard, 60_000)
        return () => {
            window.clearInterval(clock)
            window.clearInterval(refresh)
        }
    }, [loadDashboard])

    const totalItems = useMemo(
        () => reminders.length + routines.reduce((count, routine) => count + splitSteps(routine.tasks).length, 0),
        [reminders, routines],
    )

    const nextReminder = useMemo(() => {
        const nowMinutes = today.getHours() * 60 + today.getMinutes()
        return [...reminders]
            .sort((left, right) => left.time.localeCompare(right.time))
            .find((item) => minutesIntoDay(item.time) >= nowMinutes)
    }, [reminders, today])

    const completedToday = useMemo(() => {
        const ids = new Set()
        patients.forEach((patient) => patient.completed.forEach((id) => ids.add(`${patient.id}:${id}`)))
        return ids.size
    }, [patients])

    const copyCode = async () => {
        if (!profile?.caregiverCode) return
        try {
            await navigator.clipboard.writeText(profile.caregiverCode)
            setCopied('Code copied — send it to your loved one.')
        } catch {
            setCopied('Select the code above to copy it.')
        }
        window.setTimeout(() => setCopied(''), 4000)
    }

    const displayName = profile?.profile?.preferredName || profile?.fullname?.split(' ')[0] || ''

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading
                    eyebrow="Care partner dashboard"
                    title={displayName ? `${displayName}, care made a little easier` : 'Care, made a little easier'}
                    description="A shared place for routines, reminders, and meaningful moments."
                />

                {error && <p role="alert" className="form-message form-message--error">{error}</p>}

                <section className="stats-grid" aria-label="Care overview">
                    <article className="stat-card">
                        <span className="stat-card__icon" aria-hidden="true">♡</span>
                        <span className="stat-card__value">{patients.length}</span>
                        <span className="stat-card__label">People connected</span>
                    </article>
                    <article className="stat-card">
                        <span className="stat-card__icon stat-card__icon--coral" aria-hidden="true">◉</span>
                        <span className="stat-card__value">{totalItems ? completedToday : 0}<small> / {totalItems * Math.max(patients.length, 1)}</small></span>
                        <span className="stat-card__label">Checks completed today</span>
                    </article>
                    <article className="stat-card">
                        <span className="stat-card__icon" aria-hidden="true">◷</span>
                        <span className="stat-card__value stat-card__value--time">{nextReminder ? formatReminderTime(nextReminder.time) : '—'}</span>
                        <span className="stat-card__label">{nextReminder ? nextReminder.reminder : 'No more reminders today'}</span>
                    </article>
                    <article className="stat-card">
                        <span className="stat-card__icon stat-card__icon--coral" aria-hidden="true">✎</span>
                        <span className="stat-card__value">{noteCount}</span>
                        <span className="stat-card__label">Shared care notes</span>
                    </article>
                </section>

                <section className="app-panel caregiver-code-card">
                    <div className="panel-title">
                        <span className="panel-title__icon" aria-hidden="true">⌁</span>
                        <div>
                            <h2>Connect with your loved one</h2>
                            <p>Share this private connection code so they can link their account.</p>
                        </div>
                    </div>
                    {profile?.caregiverCode && (
                        <div className="connection-code-row">
                            <code className="connection-code">{profile.caregiverCode}</code>
                            <button type="button" className="app-button app-button--secondary" onClick={copyCode}>
                                Copy code
                            </button>
                        </div>
                    )}
                    {copied && <p role="status" className="form-message form-message--success">{copied}</p>}
                </section>

                <section className="dashboard-section care-circle">
                    <div className="care-notes-list__heading">
                        <div>
                            <span className="page-heading__eyebrow">YOUR CARE CIRCLE</span>
                            <h2>Today with {patients.length === 1 ? (patients[0].profile.preferredName || patients[0].fullname) : 'your loved ones'}</h2>
                        </div>
                        <button type="button" className="app-button app-button--secondary" onClick={loadDashboard} disabled={loading}>
                            {loading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {loading && <p role="status" className="app-empty">Loading your care circle...</p>}
                    {!loading && patients.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">♡</span>
                            <h2>No one is connected yet</h2>
                            <p>Share your connection code above. Your loved one can enter it from their weCare home page.</p>
                        </div>
                    )}

                    <div className="patient-card-grid">
                        {patients.map((patient) => {
                            const doneCount = patient.completed.filter((id) => (
                                id.startsWith('reminder:') || id.startsWith('routine:')
                            )).length
                            const progress = totalItems ? Math.min(100, Math.round((doneCount / totalItems) * 100)) : 0
                            const name = patient.profile.preferredName || patient.fullname
                            return (
                                <article className="patient-card" key={patient.id}>
                                    <div className="patient-card__top">
                                        <span className="patient-card__avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                                        <div>
                                            <h3>{name}</h3>
                                            <p>{patient.profile.preferredName ? `${patient.fullname} · ` : ''}Connected</p>
                                        </div>
                                        <span className={`status-pill${patient.locationSharing ? ' status-pill--on' : ''}`}>
                                            {patient.locationSharing ? 'Location shared' : 'Location private'}
                                        </span>
                                    </div>
                                    <div className="patient-card__progress">
                                        <div className="patient-card__progress-label">
                                            <span>Today's plan</span>
                                            <strong>{doneCount} of {totalItems}</strong>
                                        </div>
                                        <div className="daily-progress__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${name}'s plan completion`}>
                                            <span style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    <p className="patient-card__meta">
                                        {patient.locationSharing && patient.lastLocation
                                            ? `Location shared ${relativeTime(patient.lastLocation.updatedAt)}.`
                                            : 'Location is only shown when they choose to share it.'}
                                    </p>
                                    <div className="patient-card__actions">
                                        <Link to="/careProfile" className="app-button app-button--secondary">Care profile</Link>
                                        <Link to="/manageCareNotes" className="app-button app-button--secondary">Care notes</Link>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="dashboard-section__heading">
                        <span className="page-heading__eyebrow">CARE TOOLS</span>
                        <h2>What would you like to take care of?</h2>
                    </div>
                    <div className="feature-links">
                        <PatientFeatures text="Set reminders" route="/setReminders" />
                        <PatientFeatures text="Create a routine" route="/setRoutines" />
                        <PatientFeatures text="Add to memory album" route="/setMemoryAlbum" />
                        <PatientFeatures text="Write care notes" route="/manageCareNotes" />
                        <PatientFeatures text="View shared location" route="/viewLocation" />
                        <PatientFeatures text="Read care profile" route="/careProfile" />
                    </div>
                </section>

                <section className="care-stories">
                    <CaregiverSection video={CareGiverVideo} text="Spend less energy coordinating care and more time being together." />
                    <CaregiverSection video={careGiverVid} text="Keep everyone in sync with simple, shared tools." />
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default CareGiverWelcome
