import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PatientFeatures from '../PatientFeatures'
import Footer from '../Footer'
import PatientSection from '../PatientSection'
import HeaderPatient from '../HeaderPatient'
import PageHeading from '../PageHeading'
import api from '../../api'
import { formatReminderTime, getLocalDateKey, minutesIntoDay, relativeTime, splitSteps } from '../../utils/date'

const supportPhotos = {
    day: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
    connection: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=640&q=80',
}

function greetingFor(hour) {
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

function PatientWelcome() {
    const [currentTime, setCurrentTime] = useState(() => new Date())
    const [profile, setProfile] = useState(null)
    const [reminders, setReminders] = useState([])
    const [routines, setRoutines] = useState([])
    const [completed, setCompleted] = useState(() => new Set())
    const [caregiverCode, setCaregiverCode] = useState('')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [connectionError, setConnectionError] = useState('')
    const [locationSharing, setLocationSharing] = useState(false)
    const [lastSharedAt, setLastSharedAt] = useState(null)
    const [locationMessage, setLocationMessage] = useState('')
    const [locationError, setLocationError] = useState('')
    const [loading, setLoading] = useState(true)

    const dateKey = getLocalDateKey(currentTime)

    const loadOverview = useCallback(async () => {
        setLoading(true)
        try {
            const [me, reminderResponse, routineResponse, checkInResponse] = await Promise.all([
                api.get('/auth/me'),
                api.get('/reminders'),
                api.get('/tasks'),
                api.get(`/checkins?date=${dateKey}`),
            ])
            setProfile(me.data.user)
            setLocationSharing(Boolean(me.data.user.locationSharing))
            setLastSharedAt(me.data.user.lastLocation?.updatedAt || null)
            setReminders(reminderResponse.data)
            setRoutines(routineResponse.data)
            setCompleted(new Set(checkInResponse.data.completed || []))
        } catch (requestError) {
            setConnectionError(requestError.response?.data?.message || 'Unable to load your care space right now.')
        } finally {
            setLoading(false)
        }
    }, [dateKey])

    useEffect(() => {
        loadOverview()
    }, [loadOverview])

    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000)
        return () => window.clearInterval(timer)
    }, [])

    const summary = useMemo(() => {
        const steps = routines.flatMap((routine) => splitSteps(routine.tasks))
        const total = reminders.length + steps.length
        const validIds = [
            ...reminders.map((item) => `reminder:${item._id}`),
            ...routines.flatMap((routine) => splitSteps(routine.tasks).map((_, index) => `routine:${routine._id}:${index}`)),
        ]
        const doneCount = validIds.filter((id) => completed.has(id)).length
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
        const pending = [...reminders]
            .filter((item) => !completed.has(`reminder:${item._id}`))
            .sort((left, right) => left.time.localeCompare(right.time))
        const upcoming = pending.find((item) => minutesIntoDay(item.time) >= nowMinutes)
        // A reminder whose time has passed but is still unchecked matters more
        // than an empty "nothing else today" message.
        const stillToDo = upcoming ? null : pending[0] || null
        return { total, doneCount, upcoming, stillToDo }
    }, [reminders, routines, completed, currentTime])

    const connectCaregiver = async (event) => {
        event.preventDefault()
        setConnectionError('')
        setConnectionMessage('')
        try {
            const { data } = await api.post('/auth/link-caregiver', { code: caregiverCode })
            setConnectionMessage(data.message)
            setCaregiverCode('')
            await loadOverview()
        } catch (requestError) {
            setConnectionError(requestError.response?.data?.message || 'Unable to connect right now. Please try again.')
        }
    }

    const disconnectCaregiver = async () => {
        if (!window.confirm('Disconnect from your caregiver? They will no longer see your reminders, notes, or shared location.')) return
        setConnectionError('')
        setConnectionMessage('')
        try {
            const { data } = await api.delete('/auth/link-caregiver')
            setConnectionMessage(data.message)
            setLocationSharing(false)
            setLastSharedAt(null)
            await loadOverview()
        } catch (requestError) {
            setConnectionError(requestError.response?.data?.message || 'Unable to disconnect right now. Please try again.')
        }
    }

    const shareLocation = () => {
        setLocationError('')
        setLocationMessage('')
        if (!navigator.geolocation) {
            setLocationError('Location sharing is not available in this browser.')
            return
        }

        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const { data } = await api.post('/location', {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                })
                setLocationSharing(true)
                setLastSharedAt(new Date().toISOString())
                setLocationMessage(data.message)
            } catch (requestError) {
                setLocationError(requestError.response?.data?.message || 'Unable to share your location. Please try again.')
            }
        }, () => {
            setLocationError('Location permission was not granted. You can enable it in your browser settings.')
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
    }

    const stopSharingLocation = async () => {
        setLocationError('')
        setLocationMessage('')
        try {
            const { data } = await api.post('/location', { sharing: false })
            setLocationSharing(false)
            setLastSharedAt(null)
            setLocationMessage(data.message)
        } catch (requestError) {
            setLocationError(requestError.response?.data?.message || 'Unable to change location sharing. Please try again.')
        }
    }

    const caregiver = profile?.linkedCaregiver
    const displayName = profile?.profile?.preferredName || profile?.fullname?.split(' ')[0] || ''
    const emergencyContact = profile?.profile?.emergencyContactName

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading
                    eyebrow={currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    title={displayName ? `${greetingFor(currentTime.getHours())}, ${displayName}` : 'Welcome to your day'}
                    description="Your daily companion is here whenever you need a hand."
                >
                    <div className="live-clock">
                        <span aria-hidden="true">◷</span>
                        {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                </PageHeading>

                <section className="glance-grid" aria-label="Today at a glance">
                    <article className="glance-card">
                        <span className="glance-card__icon" aria-hidden="true">◉</span>
                        <div>
                            <span className="page-heading__eyebrow">TODAY</span>
                            <h2>{summary.doneCount} of {summary.total} things done</h2>
                            <p>
                                {summary.upcoming
                                    ? `Next: ${summary.upcoming.reminder} at ${formatReminderTime(summary.upcoming.time)}`
                                    : summary.stillToDo
                                        ? `Still to do: ${summary.stillToDo.reminder} (${formatReminderTime(summary.stillToDo.time)})`
                                        : summary.doneCount >= summary.total && summary.total > 0
                                            ? 'Everything for today has been checked off.'
                                            : summary.total
                                                ? 'No more reminders today — your routine steps are ready when you are.'
                                                : 'Your caregiver can add your first reminder.'}
                            </p>
                        </div>
                        <Link to="/today" className="app-button app-button--primary">Open my day</Link>
                    </article>
                    <article className="glance-card glance-card--soft">
                        <span className="glance-card__icon glance-card__icon--coral" aria-hidden="true">♡</span>
                        <div>
                            <span className="page-heading__eyebrow">YOUR CARE CIRCLE</span>
                            <h2>{caregiver ? caregiver.fullname || 'Connected' : 'Not connected yet'}</h2>
                            <p>{caregiver ? 'Your caregiver can share reminders, routines, and memories with you.' : 'Enter your caregiver’s private code below to get started.'}</p>
                        </div>
                    </article>
                </section>

                <section className="app-panel connection-card">
                    <div className="panel-title">
                        <span className="panel-title__icon" aria-hidden="true">♡</span>
                        <div>
                            <h2>{caregiver ? 'You are connected' : 'Connect with your caregiver'}</h2>
                            <p>{caregiver ? 'Your care circle is sharing with you. You stay in control of your own account.' : 'Enter their private code to share reminders and memories.'}</p>
                        </div>
                    </div>
                    {caregiver ? (
                        <div className="connection-connected">
                            <span className="connection-connected__pill">
                                <span aria-hidden="true">✓</span> Connected{caregiver.fullname ? ` with ${caregiver.fullname}` : ''}
                            </span>
                            <button type="button" onClick={disconnectCaregiver} className="app-button app-button--secondary">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={connectCaregiver} className="connection-form">
                            <label className="sr-only" htmlFor="caregiverConnectionCode">Caregiver connection code</label>
                            <input
                                id="caregiverConnectionCode"
                                value={caregiverCode}
                                onChange={(event) => setCaregiverCode(event.target.value.toUpperCase())}
                                maxLength={10}
                                required
                                autoComplete="off"
                                className="app-input connection-form__input"
                                placeholder="10-character code"
                            />
                            <button className="app-button app-button--primary" type="submit">
                                Connect <span aria-hidden="true">↗</span>
                            </button>
                        </form>
                    )}
                    {connectionMessage && <p role="status" className="form-message form-message--success">{connectionMessage}</p>}
                    {connectionError && <p role="alert" className="form-message form-message--error">{connectionError}</p>}
                </section>

                <section className="app-panel location-sharing-card">
                    <div className="panel-title">
                        <span className="panel-title__icon panel-title__icon--coral" aria-hidden="true">⌖</span>
                        <div>
                            <h2>Your location, your choice</h2>
                            <p>Share one current location with your caregiver. It expires after 30 minutes.</p>
                        </div>
                    </div>
                    {!caregiver && <p className="inline-notice">Connect with a caregiver above before sharing your location.</p>}
                    {locationSharing && lastSharedAt && (
                        <p className="location-sharing-card__status">
                            <span aria-hidden="true">⌖</span> Shared {relativeTime(lastSharedAt)} — it will stop showing after 30 minutes.
                        </p>
                    )}
                    <div className="location-sharing-card__actions">
                        <button type="button" onClick={shareLocation} disabled={!caregiver} className="app-button app-button--primary">
                            Share current location <span aria-hidden="true">↗</span>
                        </button>
                        {locationSharing && (
                            <button type="button" onClick={stopSharingLocation} className="app-button app-button--secondary">
                                Stop sharing
                            </button>
                        )}
                    </div>
                    {locationMessage && <p role="status" className="form-message form-message--success">{locationMessage}</p>}
                    {locationError && <p role="alert" className="form-message form-message--error">{locationError}</p>}
                </section>

                {emergencyContact && (
                    <section className="emergency-card">
                        <div>
                            <span className="page-heading__eyebrow">IF YOU NEED HELP</span>
                            <h2>Call {emergencyContact}</h2>
                            <p>This is the emergency contact saved in your care profile.</p>
                        </div>
                        {profile.profile.emergencyContactPhone ? (
                            <a className="app-button app-button--primary" href={`tel:${profile.profile.emergencyContactPhone}`}>
                                Call {emergencyContact}
                            </a>
                        ) : (
                            <Link to="/profile" className="app-button app-button--secondary">Add a phone number</Link>
                        )}
                    </section>
                )}

                <section className="patient-highlights">
                    <PatientSection image={supportPhotos.day} text="Take today one step at a time." />
                    <PatientSection image={supportPhotos.connection} text="Stay close to the people you love." />
                </section>

                <section className="dashboard-section">
                    <div className="dashboard-section__heading">
                        <span className="page-heading__eyebrow">YOUR EVERYDAY TOOLKIT</span>
                        <h2>What would you like to do?</h2>
                    </div>
                    <div className="feature-links">
                        <PatientFeatures text="Plan My Day" route="/today" />
                        <PatientFeatures text="View Today's Reminders" route="/seeReminder" />
                        <PatientFeatures text="View Memory Album" route="/seeMemoryAlbum" />
                        <PatientFeatures text="View My Routines" route="/seeRoutines" />
                        <PatientFeatures text="Shared Care Notes" route="/careNotes" />
                        <PatientFeatures text="About Me" route="/profile" />
                        <PatientFeatures text="View Weather" route="/weather" />
                        <PatientFeatures text="Play a Game" route="/seeMemoryGame" />
                    </div>
                </section>
                {loading && <p role="status" className="app-empty">Loading your care space...</p>}
            </main>
            <Footer />
        </div>
    )
}

export default PatientWelcome
