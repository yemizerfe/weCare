import { Link } from 'react-router-dom'

const icons = {
  '/today': '◉',
  '/seeReminder': '◷',
  '/seeMemoryAlbum': '▧',
  '/seeRoutines': '☷',
  '/careNotes': '♡',
  '/manageCareNotes': '♡',
  '/profile': '☺',
  '/careProfile': '☺',
  '/weather': '☀',
  '/SeeWeather': '☀',
  '/seeMemoryGame': '◇',
  '/setReminders': '◷',
  '/setRoutines': '☷',
  '/setMemoryAlbum': '▧',
  '/viewLocation': '⌖',
}

function PatientFeatures({ text, route }) {
  return (
    <Link to={route} className="feature-link">
      <span className="feature-link__icon" aria-hidden="true">{icons[route] || '◇'}</span>
      <span className="feature-link__label">{text.replace(/^[^\w]+/, '')}</span>
      <span className="feature-link__arrow" aria-hidden="true">↗</span>
    </Link>
  )
}

export default PatientFeatures
