import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'
import { getLocalDateKey } from '../../utils/date'

function Detail({ label, value }) {
    return (
        <div className="care-detail">
            <span className="care-detail__label">{label}</span>
            <span className={`care-detail__value${value ? '' : ' care-detail__value--empty'}`}>{value || 'Not shared yet'}</span>
        </div>
    )
}

function CareProfile() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        try {
            const { data } = await api.get(`/patients?date=${getLocalDateKey()}`)
            setPatients(data)
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load the care profile.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading
                    eyebrow="Knowing the person, not just the plan"
                    title="Care profile"
                    description="The details your loved one has chosen to share about themselves, their health, and who to call."
                >
                    <button type="button" className="app-button app-button--secondary" onClick={load} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                </PageHeading>

                {loading && <p role="status" className="app-empty">Loading the care profile...</p>}
                {error && <p role="alert" className="form-message form-message--error">{error}</p>}

                {!loading && patients.length === 0 && (
                    <div className="app-empty app-empty--wide">
                        <span className="empty-icon" aria-hidden="true">♡</span>
                        <h2>No one is connected yet</h2>
                        <p>Once your loved one enters your connection code, the details they share will appear here.</p>
                        <Link to="/caregiver" className="app-button app-button--primary">Get your connection code</Link>
                    </div>
                )}

                <div className="care-profile-stack">
                    {patients.map((patient) => {
                        const profile = patient.profile
                        const name = profile.preferredName || patient.fullname
                        return (
                            <article className="app-panel care-profile-card" key={patient.id}>
                                <header className="care-profile-card__header">
                                    <span className="patient-card__avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                                    <div>
                                        <span className="page-heading__eyebrow">CARE PROFILE</span>
                                        <h2>{name}</h2>
                                        <p>{profile.preferredName ? `Full name: ${patient.fullname}` : 'Connected with you'}</p>
                                    </div>
                                    <Link to="/manageCareNotes" className="app-button app-button--secondary">Add a care note</Link>
                                </header>

                                <div className="care-profile-card__grid">
                                    <section className="care-profile-block">
                                        <h3><span aria-hidden="true">☺</span> About {name}</h3>
                                        <p>{profile.aboutMe || 'They have not added a story yet.'}</p>
                                    </section>

                                    <section className="care-profile-block">
                                        <h3><span aria-hidden="true">✚</span> Health and safety</h3>
                                        <Detail label="Allergies" value={profile.allergies} />
                                        <Detail label="Medications" value={profile.medications} />
                                        <Detail label="Home address" value={profile.homeAddress} />
                                    </section>

                                    <section className="care-profile-block">
                                        <h3><span aria-hidden="true">☎</span> People to call</h3>
                                        <Detail label="Emergency contact" value={profile.emergencyContactName} />
                                        {profile.emergencyContactPhone ? (
                                            <a className="care-profile-phone" href={`tel:${profile.emergencyContactPhone}`}>{profile.emergencyContactPhone}</a>
                                        ) : null}
                                        <Detail label="Doctor" value={profile.doctorName} />
                                        {profile.doctorPhone ? (
                                            <a className="care-profile-phone" href={`tel:${profile.doctorPhone}`}>{profile.doctorPhone}</a>
                                        ) : null}
                                    </section>
                                </div>

                                <p className="daily-plan-footnote">
                                    Your loved one controls this information and can update it from their About me page at any time.
                                </p>
                            </article>
                        )
                    })}
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default CareProfile
