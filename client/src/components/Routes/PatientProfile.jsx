import { useEffect, useState } from 'react'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'

const emptyForm = {
    fullname: '',
    preferredName: '',
    aboutMe: '',
    allergies: '',
    medications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    doctorName: '',
    doctorPhone: '',
    homeAddress: '',
}

function PatientProfile() {
    const [form, setForm] = useState(emptyForm)
    const [caregiver, setCaregiver] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('/auth/me')
            .then(({ data }) => {
                const { user } = data
                setForm({
                    fullname: user.fullname || '',
                    preferredName: user.profile?.preferredName || '',
                    aboutMe: user.profile?.aboutMe || '',
                    allergies: user.profile?.allergies || '',
                    medications: user.profile?.medications || '',
                    emergencyContactName: user.profile?.emergencyContactName || '',
                    emergencyContactPhone: user.profile?.emergencyContactPhone || '',
                    doctorName: user.profile?.doctorName || '',
                    doctorPhone: user.profile?.doctorPhone || '',
                    homeAddress: user.profile?.homeAddress || '',
                })
                setCaregiver(user.linkedCaregiver)
            })
            .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your care profile.'))
            .finally(() => setLoading(false))
    }, [])

    const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

    const save = async (event) => {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        setError('')
        try {
            const { data } = await api.patch('/profile', form)
            setMessage(data.message || 'Your details have been saved.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save your details. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading
                    eyebrow="Your story, in your words"
                    title="About me"
                    description="These details help the people who care for you understand what matters. Only your connected caregiver can see them."
                />

                {caregiver ? (
                    <p className="profile-visibility">
                        <span aria-hidden="true">♡</span>
                        Shared with {caregiver.fullname || 'your caregiver'}. You can change or remove anything here at any time.
                    </p>
                ) : (
                    <p className="inline-notice">You are not connected to a caregiver yet, so only you can see this information.</p>
                )}

                {loading && <p role="status" className="app-empty">Loading your care profile...</p>}

                {!loading && (
                    <form className="profile-form" onSubmit={save}>
                        <section className="app-panel profile-section">
                            <div className="form-panel__intro">
                                <span className="form-panel__icon" aria-hidden="true">☺</span>
                                <div>
                                    <h2>What should people call you?</h2>
                                    <p>A familiar name helps everyone feel more at ease.</p>
                                </div>
                            </div>
                            <div className="field-grid">
                                <div className="field">
                                    <label htmlFor="profileFullName">Full name</label>
                                    <input id="profileFullName" className="app-input" value={form.fullname} onChange={update('fullname')} maxLength={100} required />
                                </div>
                                <div className="field">
                                    <label htmlFor="profilePreferredName">Name you like to be called</label>
                                    <input id="profilePreferredName" className="app-input" value={form.preferredName} onChange={update('preferredName')} maxLength={60} placeholder="Maggie" />
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="profileAboutMe">A little about me</label>
                                <textarea id="profileAboutMe" className="app-input app-textarea" value={form.aboutMe} onChange={update('aboutMe')} maxLength={600} rows={4}
                                    placeholder="Where you grew up, what you enjoy, people and places that matter to you." />
                                <span className="label-hint">{form.aboutMe.length}/600 characters</span>
                            </div>
                        </section>

                        <section className="app-panel profile-section">
                            <div className="form-panel__intro">
                                <span className="form-panel__icon form-panel__icon--coral" aria-hidden="true">✚</span>
                                <div>
                                    <h2>Health and safety</h2>
                                    <p>This is not a medical record. Share only what helps your care team.</p>
                                </div>
                            </div>
                            <div className="field-grid">
                                <div className="field">
                                    <label htmlFor="profileAllergies">Allergies</label>
                                    <input id="profileAllergies" className="app-input" value={form.allergies} onChange={update('allergies')} maxLength={300} placeholder="Penicillin, nuts…" />
                                </div>
                                <div className="field">
                                    <label htmlFor="profileMedications">Medications</label>
                                    <input id="profileMedications" className="app-input" value={form.medications} onChange={update('medications')} maxLength={500} placeholder="Name, dose, and time" />
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="profileAddress">Home address</label>
                                <input id="profileAddress" className="app-input" value={form.homeAddress} onChange={update('homeAddress')} maxLength={200} autoComplete="street-address" />
                            </div>
                        </section>

                        <section className="app-panel profile-section">
                            <div className="form-panel__intro">
                                <span className="form-panel__icon" aria-hidden="true">☎</span>
                                <div>
                                    <h2>People to call</h2>
                                    <p>An emergency contact and your doctor, if you would like them saved.</p>
                                </div>
                            </div>
                            <div className="field-grid">
                                <div className="field">
                                    <label htmlFor="emergencyName">Emergency contact name</label>
                                    <input id="emergencyName" className="app-input" value={form.emergencyContactName} onChange={update('emergencyContactName')} maxLength={100} />
                                </div>
                                <div className="field">
                                    <label htmlFor="emergencyPhone">Emergency contact phone</label>
                                    <input id="emergencyPhone" className="app-input" type="tel" value={form.emergencyContactPhone} onChange={update('emergencyContactPhone')} maxLength={40} autoComplete="tel" />
                                </div>
                                <div className="field">
                                    <label htmlFor="doctorName">Doctor’s name</label>
                                    <input id="doctorName" className="app-input" value={form.doctorName} onChange={update('doctorName')} maxLength={100} />
                                </div>
                                <div className="field">
                                    <label htmlFor="doctorPhone">Doctor’s phone</label>
                                    <input id="doctorPhone" className="app-input" type="tel" value={form.doctorPhone} onChange={update('doctorPhone')} maxLength={40} />
                                </div>
                            </div>
                        </section>

                        <div className="profile-form__actions">
                            <button type="submit" className="app-button app-button--primary" disabled={saving}>
                                {saving ? 'Saving…' : 'Save my details'}
                            </button>
                        </div>
                        {message && <p role="status" className="form-message form-message--success">{message}</p>}
                        {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    </form>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default PatientProfile
