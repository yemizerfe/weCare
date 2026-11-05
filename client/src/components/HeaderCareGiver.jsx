import { NavLink, Link } from 'react-router-dom'
import SignOutButton from './SignOutButton'
import TextSizeControl from './TextSizeControl'

function HeaderCareGiver() {
  const navClass = ({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`

  return (
    <header className="app-header">
      <Link to="/caregiver" className="app-brand" aria-label="weCare home">
        <span className="app-brand__mark">w</span>
        <span>weCare<small>CARE PARTNER</small></span>
      </Link>
      <nav aria-label="Caregiver navigation" className="app-nav">
        <NavLink to="/caregiver" end className={navClass}><span aria-hidden="true">⌂</span> Overview</NavLink>
        <NavLink to="/setReminders" className={navClass}><span aria-hidden="true">◷</span> Reminders</NavLink>
        <NavLink to="/setMemoryAlbum" className={navClass}><span aria-hidden="true">▧</span> Memories</NavLink>
        <NavLink to="/setRoutines" className={navClass}><span aria-hidden="true">☷</span> Routines</NavLink>
        <NavLink to="/manageCareNotes" className={navClass}><span aria-hidden="true">♡</span> Care notes</NavLink>
        <NavLink to="/careProfile" className={navClass}><span aria-hidden="true">☺</span> Care profile</NavLink>
        <NavLink to="/viewLocation" className={navClass}><span aria-hidden="true">⌖</span> Location</NavLink>
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

export default HeaderCareGiver
