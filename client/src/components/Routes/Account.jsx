import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderPatient from '../HeaderPatient'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'

function Account() {
    const [user, setUser] = useState(null)
    const [fullname, setFullname] = useState('')
    const [preferredName, setPreferredName] = useState('')
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileMessage, setProfileMessage] = useState('')
    const [profileError, setProfileError] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        api.get('/auth/me')
            .then(({ data }) => {
                setUser(data.user)
                setFullname(data.user.fullname)
                setPreferredName(data.user.profile?.preferredName || '')
            })
            .catch((requestError) => setLoadError(requestError.response?.data?.message || 'Unable to load your account.'))
            .finally(() => setLoading(false))
    }, [])

    const saveProfile = async (event) => {
        event.preventDefault()
        setProfileSaving(true)
        setProfileMessage('')
        setProfileError('')
        try {
            const { data } = await api.patch('/profile', {
                fullname,
                ...(user.role === 'patient' ? { preferredName } : {}),
            })
            setUser(data.user)
            setProfileMessage(data.message || 'Your details have been saved.')
        } catch (requestError) {
            setProfileError(requestError.response?.data?.message || 'Unable to save your details.')
        } finally {
            setProfileSaving(false)
        }
    }

    const changePassword = async (event) => {
        event.preventDefault()
        setPasswordMessage('')
        setPasswordError('')
        if (newPassword !== confirmPassword) {
            setPasswordError('Your new passwords do not match.')
            return
        }
        setPasswordSaving(true)
        try {
            const { data } = await api.patch('/auth/password', { currentPassword, newPassword })
            setPasswordMessage(data.message || 'Your password has been updated.')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (requestError) {
            setPasswordError(requestError.response?.data?.message || 'Unable to update your password.')
        } finally {
            setPasswordSaving(false)
        }
    }

    const copyCode = async () => {
        if (!user?.caregiverCode) return
        try {
            await navigator.clipboard.writeText(user.caregiverCode)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 3000)
        } catch {
            setCopied(false)
        }
    }

    const header = user?.role === 'caregiver' ? <HeaderCareGiver /> : <HeaderPatient />

    return (
        <div className="app-page">
            {header}
            <main className="app-main">
                <PageHeading
                    eyebrow="Your account"
                    title="Account and security"
                    description="Keep your name and password up to date. Your information stays private to you and your care circle."
                />

                {loading && <p role="status" className="app-empty">Loading your account...</p>}
                {loadError && <p role="alert" className="form-message form-message--error">{loadError}</p>}

                {user && (
                    <div className="account-grid">
                        <section className="app-panel account-card">
                            <h2>Your details</h2>
                            <p className="account-card__hint">Signed in as {user.email} · {user.role === 'caregiver' ? 'Caregiver' : 'Patient'}</p>
                            <form className="app-form" onSubmit={saveProfile}>
                                <label htmlFor="accountName">Full name</label>
                                <input id="accountName" className="app-input" value={fullname} onChange={(event) => setFullname(event.target.value)} maxLength={100} required />

                                {user.role === 'patient' && (
                                    <>
                                        <label htmlFor="accountPreferredName">Name you like to be called</label>
                                        <input id="accountPreferredName" className="app-input" value={preferredName} onChange={(event) => setPreferredName(event.target.value)} maxLength={60} />
                                    </>
                                )}

                                <button type="submit" className="app-button app-button--primary" disabled={profileSaving}>
                                    {profileSaving ? 'Saving…' : 'Save details'}
                                </button>
                            </form>
                            {profileMessage && <p role="status" className="form-message form-message--success">{profileMessage}</p>}
                            {profileError && <p role="alert" className="form-message form-message--error">{profileError}</p>}

                            {user.role === 'caregiver' && user.caregiverCode && (
                                <div className="account-code">
                                    <span className="page-heading__eyebrow">YOUR CONNECTION CODE</span>
                                    <code>{user.caregiverCode}</code>
                                    <button type="button" className="app-button app-button--secondary" onClick={copyCode}>
                                        {copied ? 'Copied' : 'Copy code'}
                                    </button>
                                </div>
                            )}

                            <div className="account-card__links">
                                {user.role === 'patient' ? (
                                    <Link to="/profile" className="app-button app-button--secondary">Edit my About me page</Link>
                                ) : (
                                    <Link to="/careProfile" className="app-button app-button--secondary">Open care profile</Link>
                                )}
                                <Link to={user.role === 'patient' ? '/patient' : '/caregiver'} className="app-button app-button--secondary">Back to my dashboard</Link>
                            </div>
                        </section>

                        <section className="app-panel account-card">
                            <h2>Change password</h2>
                            <p className="account-card__hint">Use at least 8 characters. You will stay signed in on this device.</p>
                            <form className="app-form" onSubmit={changePassword}>
                                <label htmlFor="currentPassword">Current password</label>
                                <input id="currentPassword" className="app-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />

                                <label htmlFor="newPassword">New password</label>
                                <input id="newPassword" className="app-input" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />

                                <label htmlFor="confirmNewPassword">Confirm new password</label>
                                <input id="confirmNewPassword" className="app-input" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />

                                <button type="submit" className="app-button app-button--primary" disabled={passwordSaving}>
                                    {passwordSaving ? 'Updating…' : 'Update password'}
                                </button>
                            </form>
                            {passwordMessage && <p role="status" className="form-message form-message--success">{passwordMessage}</p>}
                            {passwordError && <p role="alert" className="form-message form-message--error">{passwordError}</p>}
                        </section>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default Account
