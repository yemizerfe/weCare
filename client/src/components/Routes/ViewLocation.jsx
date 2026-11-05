import { useCallback, useEffect, useState } from 'react'
import HeaderCareGiver from '../HeaderCareGiver'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'
import { getLocalDateKey, relativeTime } from '../../utils/date'

function mapSrc(patient) {
    const latitude = Number(patient.latitude)
    const longitude = Number(patient.longitude)
    const latPad = 0.008
    const lonPad = 0.012
    const bbox = [longitude - lonPad, latitude - latPad, longitude + lonPad, latitude + latPad].join(',')
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude},${longitude}`
}

function ViewLocation() {
    const [shares, setShares] = useState([])
    const [patients, setPatients] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(null)

    const loadLocations = useCallback(async () => {
        try {
            const [locationResponse, patientResponse] = await Promise.all([
                api.get('/location'),
                api.get(`/patients?date=${getLocalDateKey()}`),
            ])
            setShares(locationResponse.data)
            setPatients(patientResponse.data)
            setLastUpdated(new Date())
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load shared locations. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadLocations()
        const interval = window.setInterval(loadLocations, 60_000)
        return () => window.clearInterval(interval)
    }, [loadLocations])

    const notSharing = patients.filter((patient) => !patient.locationSharing)

    return (
        <div className="app-page">
            <HeaderCareGiver />
            <main className="app-main">
                <PageHeading eyebrow="Connected with care" title="Shared location" description="Only locations your loved one has chosen to share are shown here.">
                    <button type="button" className="app-button app-button--secondary" onClick={loadLocations} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh now'}
                    </button>
                </PageHeading>

                <p className="privacy-note">
                    <span aria-hidden="true">⌖</span> Location updates expire after 30 minutes for added privacy. This page refreshes automatically every minute.
                    {lastUpdated && <span className="privacy-note__stamp"> Updated {relativeTime(lastUpdated)}.</span>}
                </p>

                {loading && <p role="status" className="app-empty">Loading shared locations...</p>}
                {error && <p role="alert" className="form-message form-message--error">{error}</p>}

                {!loading && !error && shares.length === 0 && (
                    <div className="app-empty app-empty--wide">
                        <span className="empty-icon" aria-hidden="true">⌖</span>
                        <h2>No location shared right now</h2>
                        <p>Your loved one can choose to share their current location from their weCare home page.</p>
                    </div>
                )}

                <div className="location-cards">
                    {shares.map((patient) => (
                        <article className="location-card location-card--map" key={patient.id}>
                            <div className="location-card__map">
                                <iframe
                                    title={`Map of ${patient.fullname}'s shared location`}
                                    src={mapSrc(patient)}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <div className="location-card__details">
                                <div>
                                    <span className="page-heading__eyebrow">SHARED WITH YOU</span>
                                    <h2>{patient.preferredName || patient.fullname}</h2>
                                    <p>Shared {relativeTime(patient.updatedAt)} · stops showing after 30 minutes.</p>
                                    <p className="location-card__coords">{Number(patient.latitude).toFixed(4)}, {Number(patient.longitude).toFixed(4)}</p>
                                </div>
                                <a
                                    className="app-button app-button--primary"
                                    href={`https://www.google.com/maps?q=${encodeURIComponent(`${patient.latitude},${patient.longitude}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open in maps <span aria-hidden="true">↗</span>
                                </a>
                            </div>
                        </article>
                    ))}
                </div>

                {notSharing.length > 0 && (
                    <section className="dashboard-section">
                        <span className="page-heading__eyebrow">NOT SHARING RIGHT NOW</span>
                        <ul className="quiet-list">
                            {notSharing.map((patient) => (
                                <li key={patient.id}>
                                    <span aria-hidden="true">⌖</span>
                                    <span><strong>{patient.profile.preferredName || patient.fullname}</strong> has chosen not to share a location right now.</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default ViewLocation
