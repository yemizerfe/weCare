import { useEffect, useState } from 'react'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'

function SeeRecipe() {
    const [routines, setRoutines] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/tasks')
            .then(({ data }) => setRoutines(data))
            .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load routines. Please try again.'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading eyebrow="One step at a time" title="My routines" description="Your familiar steps are here whenever you need a little reminder." />
                <section className="routine-grid" aria-live="polite">
                    {loading && <p role="status" className="app-empty">Loading your routines...</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    {!loading && !error && routines.length === 0 && (
                        <div className="app-empty app-empty--wide">
                            <span className="empty-icon" aria-hidden="true">☷</span>
                            <h2>Your routines will show up here</h2>
                            <p>Your caregiver can add familiar step-by-step routines whenever you need them.</p>
                        </div>
                    )}
                    {routines.map((routine) => (
                        <article key={routine._id} className="routine-card">
                            <span className="routine-card__icon" aria-hidden="true">☷</span>
                            <h2>{routine.title}</h2>
                            <ol>
                                {routine.tasks.split(/\r?\n/).filter(Boolean).map((step, index) => (
                                    <li key={`${routine._id}-${index}`}>
                                        <span className="routine-step__number">{index + 1}</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </article>
                    ))}
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default SeeRecipe
