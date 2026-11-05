import { NavLink, Link } from 'react-router-dom'
import SignOutButton from './SignOutButton'
import TextSizeControl from './TextSizeControl'

function HeaderPatient() {
  const navClass = ({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`

  return (
    <header className="app-header">
      <Link to="/patient" className="app-brand" aria-label="weCare home">
        <span className="app-brand__mark">w</span>
        <span>weCare<small>YOUR CARE SPACE</small></span>
      </Link>
      <nav aria-label="Patient navigation" className="app-nav">
        <NavLink to="/patient" end className={navClass}><span aria-hidden="true">⌂</span> Home</NavLink>
        <NavLink to="/today" className={navClass}><span aria-hidden="true">◉</span> My day</NavLink>
        <NavLink to="/seeReminder" className={navClass}><span aria-hidden="true">◷</span> Reminders</NavLink>
        <NavLink to="/seeMemoryAlbum" className={navClass}><span aria-hidden="true">▧</span> Memories</NavLink>
        <NavLink to="/seeRoutines" className={navClass}><span aria-hidden="true">☷</span> Routines</NavLink>
        <NavLink to="/careNotes" className={navClass}><span aria-hidden="true">♡</span> Care notes</NavLink>
        <NavLink to="/profile" className={navClass}><span aria-hidden="true">☺</span> About me</NavLink>
        <NavLink to="/weather" className={navClass}><span aria-hidden="true">☀</span> Weather</NavLink>
        <NavLink to="/seeMemoryGame" className={navClass}><span aria-hidden="true">◇</span> Games</NavLink>
      </nav>
      <div className="app-header__account">
        <TextSizeControl />
        <Link to="/account" className="app-signout app-account-link" aria-label="Account settings">
          <span aria-hidden="true">☺</span> Account
        </Link>
        <SignOutButton />
      </div>
    </header>
  )
}

export default HeaderPatient
