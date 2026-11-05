import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'
import { formatReminderTime, getLocalDateKey, minutesIntoDay, splitSteps } from '../../utils/date'
import { playChime } from '../../utils/chime'

const soundStorageKey = 'wecare:reminder-sound'
const DUE_WINDOW_MINUTES = 90

function readSoundPreference() {
    try {
        return window.localStorage.getItem(soundStorageKey) === 'on'
    } catch {
        return false
    }
}

function TodayPlan() {
    const [profile, setProfile] = useState(null)
    const [reminders, setReminders] = useState([])
    const [routines, setRoutines] = useState([])
    const [completed, setCompleted] = useState(() => new Set())
    const [savingIds, setSavingIds] = useState(() => new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [soundOn, setSoundOn] = useState(readSoundPreference)
    const [now, setNow] = useState(() => new Date())
    const playedRef = useRef(new Set())
    const dateKey = getLocalDateKey(now)

    const loadPlan = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true)
        try {
            const [me, reminderResponse, routineResponse, checkInResponse] = await Promise.all([
                api.get('/auth/me'),
                api.get('/reminders'),
                api.get('/tasks'),
                api.get(`/checkins?date=${dateKey}`),
            ])
            setProfile(me.data.user)
            setReminders(reminderResponse.data)
            setRoutines(routineResponse.data)
            setCompleted(new Set(checkInResponse.data.completed || []))
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load your plan. Please try again.')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [dateKey])

    useEffect(() => {
        loadPlan()
    }, [loadPlan])

    useEffect(() => {
        const clock = window.setInterval(() => setNow(new Date()), 30_000)
        const refresh = window.setInterval(() => loadPlan({ silent: true }), 60_000)
        return () => {
            window.clearInterval(clock)
            window.clearInterval(refresh)
        }
    }, [loadPlan])

    const steps = useMemo(() => routines.flatMap((routine) => (
        splitSteps(routine.tasks).map((text, index) => ({
            id: `routine:${routine._id}:${index}`,
            routine: routine.title,
            text,
        }))
    )), [routines])

    const sortedReminders = useMemo(
        () => [...reminders].sort((left, right) => left.time.localeCompare(right.time)),
        [reminders],
    )
    const validIds = useMemo(
        () => [...sortedReminders.map((item) => `reminder:${item._id}`), ...steps.map((step) => step.id)],
        [sortedReminders, steps],
    )
    const doneCount = validIds.filter((id) => completed.has(id)).length
    const total = validIds.length
    const progress = total ? Math.round((doneCount / total) * 100) : 0
    const allDone = total > 0 && doneCount === total

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const pendingReminders = sortedReminders.filter((item) => !completed.has(`reminder:${item._id}`))
    const dueReminder = pendingReminders.find((item) => {
        const minutes = minutesIntoDay(item.time)
        return minutes <= nowMinutes && nowMinutes - minutes <= DUE_WINDOW_MINUTES
    })
    const nextReminder = pendingReminders.find((item) => minutesIntoDay(item.time) > nowMinutes)
    // Reminders whose time has passed but were never ticked off stay visible;
    // skipping them would quietly drop a task the person still means to do.
    const overdueReminder = !dueReminder && !nextReminder ? pendingReminders[0] || null : null
    const spotlight = dueReminder || nextReminder || overdueReminder

    useEffect(() => {
        if (!soundOn || !profile?.linkedCaregiver) return
        if (dueReminder && !playedRef.current.has(dueReminder._id)) {
            playedRef.current.add(dueReminder._id)
            playChime()
        }
    }, [dueReminder, soundOn, profile])

    useEffect(() => {
        if (allDone && total > 0 && !playedRef.current.has('celebration')) {
            playedRef.current.add('celebration')
            if (soundOn) playChime()
        }
    }, [allDone, total, soundOn])

    const toggleItem = async (id) => {
        if (savingIds.has(id)) return
        const wasDone = completed.has(id)
        const previous = completed
        const next = new Set(completed)
        if (wasDone) next.delete(id)
        else next.add(id)

        setCompleted(next)
        setSavingIds((current) => new Set(current).add(id))
        setNotice('')

        try {
            await api.post('/checkins', { dateKey, itemId: id, done: !wasDone })
        } catch (requestError) {
            setCompleted(previous)
            setNotice(requestError.response?.data?.message || 'We could not save that just now. Please try again.')
        } finally {
            setSavingIds((current) => {
                const updated = new Set(current)
                updated.delete(id)
                return updated
            })
        }
    }

    const toggleSound = () => {
        const next = !soundOn
        setSoundOn(next)
        try {
            window.localStorage.setItem(soundStorageKey, next ? 'on' : 'off')
        } catch {
            // The preference simply will not persist.
        }
        if (next) playChime()
    }

    const greetingName = profile?.profile?.preferredName || profile?.fullname?.split(' ')[0] || ''
    const needsCaregiver = profile && !profile.linkedCaregiver

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading
                    eyebrow={now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    title={greetingName ? `${greetingName}, here is your day` : 'My day, one step at a time'}
                    description="Your reminders and familiar routines, together in one gentle plan."
                />

                {profile && !needsCaregiver && (
                    <section className={`up-next-card${dueReminder ? ' up-next-card--due' : ''}`} aria-live="polite">
                        <div className="up-next-card__icon" aria-hidden="true">
                            {dueReminder ? '◷' : allDone ? '✓' : '☀'}
                        </div>
                        <div className="up-next-card__body">
                            <span className="page-heading__eyebrow">
                                {dueReminder ? 'IT IS TIME' : overdueReminder ? 'STILL TO DO' : allDone ? 'ALL DONE FOR TODAY' : 'COMING UP'}
                            </span>
                            {dueReminder && (
                                <>
                                    <h2>{dueReminder.reminder}</h2>
                                    <p>Scheduled for {formatReminderTime(dueReminder.time)}. Take your time.</p>
                                </>
                            )}
                            {!dueReminder && nextReminder && (
                                <>
                                    <h2>{nextReminder.reminder}</h2>
                                    <p>At {formatReminderTime(nextReminder.time)} today.</p>
                                </>
                            )}
                            {overdueReminder && (
                                <>
                                    <h2>{overdueReminder.reminder}</h2>
                                    <p>Scheduled for {formatReminderTime(overdueReminder.time)}. Whenever you are ready.</p>
                                </>
                            )}
                            {!dueReminder && !nextReminder && !overdueReminder && (
                                <>
                                    <h2>{allDone ? 'You finished everything — wonderful.' : 'Nothing else is scheduled today.'}</h2>
                                    <p>{allDone ? 'Sit back and enjoy the rest of your day.' : 'You can still look back at your routines or memories.'}</p>
                                </>
                            )}
                        </div>
                        <div className="up-next-card__actions">
                            {spotlight && (
                                <button
                                    type="button"
                                    className="app-button app-button--primary"
                                    onClick={() => toggleItem(`reminder:${spotlight._id}`)}
                                    disabled={savingIds.has(`reminder:${spotlight._id}`)}
                                >
                                    Mark as done
                                </button>
                            )}
                            <button
                                type="button"
                                className={`sound-toggle${soundOn ? ' sound-toggle--on' : ''}`}
                                onClick={toggleSound}
                                aria-pressed={soundOn}
                            >
                                <span aria-hidden="true">{soundOn ? '♪' : '♪'}</span>
                                {soundOn ? 'Reminder sound on' : 'Turn on reminder sound'}
                            </button>
                        </div>
                    </section>
                )}

                <section className="daily-progress" aria-label="Today's progress">
                    <div className="daily-progress__top">
                        <div>
                            <span className="page-heading__eyebrow">YOUR PROGRESS</span>
                            <h2>{total === 0 ? 'Your day is ready' : allDone ? 'You did it — wonderful work!' : 'You are doing great'}</h2>
                        </div>
                        <span className="daily-progress__count">{doneCount}<small> / {total}</small></span>
                    </div>
                    <div className="daily-progress__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Plan completion">
                        <span style={{ width: `${progress}%` }} />
                    </div>
                    <p>{total === 0 ? 'Your caregiver can add reminders and routines to get started.' : `${progress}% of today's plan complete. Go at your own pace.`}</p>
                </section>

                {needsCaregiver && (
                    <p className="inline-notice">
                        Connect with your caregiver to see shared reminders and save your progress.{' '}
                        <Link to="/patient">Connect now</Link>
                    </p>
                )}
                {notice && <p role="alert" className="form-message form-message--error">{notice}</p>}
                {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                {loading && <p role="status" className="app-empty">Putting your day together...</p>}

                {!loading && (
                    <div className="daily-plan-grid">
                        <section className="daily-plan-section">
                            <div className="daily-plan-section__heading">
                                <span className="daily-plan-section__icon" aria-hidden="true">◷</span>
                                <div><h2>Reminders</h2><p>A gentle nudge, right when you need it.</p></div>
                            </div>
                            {sortedReminders.length === 0
                                ? <p className="daily-plan-empty">No reminders scheduled for today.</p>
                                : <ul className="daily-reminders">
                                    {sortedReminders.map((item) => {
                                        const id = `reminder:${item._id}`
                                        const isDone = completed.has(id)
                                        return (
                                            <li key={item._id} className={`daily-reminder${isDone ? ' daily-reminder--done' : ''}`}>
                                                <time dateTime={item.time}>{formatReminderTime(item.time)}</time>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={isDone}
                                                        disabled={savingIds.has(id)}
                                                        onChange={() => toggleItem(id)}
                                                    />
                                                    <span>{item.reminder}</span>
                                                </label>
                                            </li>
                                        )
                                    })}
                                </ul>}
                        </section>

                        <section className="daily-plan-section">
                            <div className="daily-plan-section__heading">
                                <span className="daily-plan-section__icon daily-plan-section__icon--coral" aria-hidden="true">☷</span>
                                <div><h2>Familiar routines</h2><p>Take each step in whatever time feels right.</p></div>
                            </div>
                            {routines.length === 0
                                ? <p className="daily-plan-empty">Your caregiver can add a familiar routine anytime.</p>
                                : <div className="daily-routines">
                                    {routines.map((routine) => (
                                        <article className="daily-routine" key={routine._id}>
                                            <h3>{routine.title}</h3>
                                            <ul>
                                                {splitSteps(routine.tasks).map((text, index) => {
                                                    const id = `routine:${routine._id}:${index}`
                                                    const isDone = completed.has(id)
                                                    return (
                                                        <li className={isDone ? 'daily-routine__step--done' : ''} key={id}>
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isDone}
                                                                    disabled={savingIds.has(id)}
                                                                    onChange={() => toggleItem(id)}
                                                                />
                                                                <span className="daily-routine__number">{index + 1}</span>
                                                                <span>{text}</span>
                                                            </label>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </article>
                                    ))}
                                </div>}
                        </section>
                    </div>
                )}
                {!loading && (
                    <p className="daily-plan-footnote">
                        Your progress is saved to your account, so your caregiver can see how today is going.
                    </p>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default TodayPlan
