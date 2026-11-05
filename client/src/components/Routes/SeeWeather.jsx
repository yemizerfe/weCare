import { useCallback, useEffect, useState } from 'react'
import HeaderPatient from '../HeaderPatient'
import Footer from '../Footer'
import PageHeading from '../PageHeading'
import api from '../../api'

const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with hail',
}

const cityStorageKey = 'wecare:weather-city'

function weatherSymbol(code) {
    if (code === undefined || code === null) return '☀'
    if (code >= 95) return '⛈'
    if (code >= 71) return '❄'
    if (code >= 51) return '☂'
    if (code >= 45) return '☁'
    if (code >= 1) return '☁'
    return '☀'
}

function SeeWeather() {
    const [weather, setWeather] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [city, setCity] = useState('')

    const loadByCoords = useCallback(async (latitude, longitude) => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/weather', { params: { latitude, longitude } })
            setWeather(data)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Weather is temporarily unavailable. Please try again later.')
        } finally {
            setLoading(false)
        }
    }, [])

    const loadByCity = useCallback(async (cityName, { save = true } = {}) => {
        setLoading(true)
        setError('')
        try {
            const { data } = await api.get('/weather', { params: { city: cityName } })
            setWeather(data)
            if (save) {
                try {
                    window.localStorage.setItem(cityStorageKey, cityName)
                } catch {
                    // The city just will not be remembered.
                }
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'We could not load the weather for that place.')
        } finally {
            setLoading(false)
        }
    }, [])

    const requestMyLocation = useCallback(() => {
        setError('')
        if (!navigator.geolocation) {
            setError('Location access is not available in this browser. You can enter a city instead.')
            return
        }
        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => loadByCoords(coords.latitude, coords.longitude),
            () => {
                setLoading(false)
                setError('Location permission was not granted. Enter a town or city below instead.')
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        )
    }, [loadByCoords])

    useEffect(() => {
        let saved = ''
        try {
            saved = window.localStorage.getItem(cityStorageKey) || ''
        } catch {
            saved = ''
        }
        if (saved) {
            setCity(saved)
            loadByCity(saved, { save: false })
        } else {
            requestMyLocation()
        }
    }, [loadByCity, requestMyLocation])

    const submitCity = (event) => {
        event.preventDefault()
        if (!city.trim()) return
        loadByCity(city.trim())
    }

    const current = weather?.current
    const units = weather?.units || {}
    const description = current ? weatherDescriptions[current.weather_code] || 'Current conditions' : ''
    const placeLabel = weather?.place || (weather ? 'Near your device' : '')

    return (
        <div className="app-page">
            <HeaderPatient />
            <main className="app-main">
                <PageHeading eyebrow="A quick look outside" title="Local weather" description="A little help planning what to wear or how to spend the day.">
                    <button type="button" className="app-button app-button--secondary" onClick={requestMyLocation} disabled={loading}>
                        Use my location
                    </button>
                </PageHeading>

                <form className="weather-search" onSubmit={submitCity}>
                    <label htmlFor="weatherCity">Where would you like the weather for?</label>
                    <div className="weather-search__row">
                        <input
                            id="weatherCity"
                            className="app-input"
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="Enter a town or city"
                            maxLength={80}
                            autoComplete="address-level2"
                        />
                        <button type="submit" className="app-button app-button--primary" disabled={loading}>
                            {loading ? 'Looking up…' : 'Show weather'}
                        </button>
                    </div>
                </form>

                <section className="weather-card">
                    <div className="weather-card__symbol" aria-hidden="true">{weatherSymbol(current?.weather_code)}</div>
                    {loading && <p role="status">Finding the weather...</p>}
                    {error && <p role="alert" className="form-message form-message--error">{error}</p>}
                    {current && !loading && (
                        <div className="weather-card__content">
                            {placeLabel && <p className="weather-card__place">{placeLabel}</p>}
                            <p className="weather-card__temperature">
                                {Math.round(current.temperature_2m)}<span>{units.temperature_2m || '°C'}</span>
                            </p>
                            <p className="weather-card__description">{description}</p>
                            <div className="weather-details">
                                <p><span>Feels like</span><strong>{Math.round(current.apparent_temperature)}{units.apparent_temperature || '°C'}</strong></p>
                                <p><span>Humidity</span><strong>{current.relative_humidity_2m}{units.relative_humidity_2m || '%'}</strong></p>
                                <p><span>Wind</span><strong>{current.wind_speed_10m} {units.wind_speed_10m || 'km/h'}</strong></p>
                            </div>
                            <p className="weather-card__updated">Updated {new Date(current.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                            <p className="weather-card__credit">
                                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                                    Weather data by Open-Meteo.com
                                </a>
                            </p>
                        </div>
                    )}
                </section>

                <p className="daily-plan-footnote">
                    If you enter a city, we will remember it on this device for next time. You can still choose to use your current location.
                </p>
            </main>
            <Footer />
        </div>
    )
}

export default SeeWeather
