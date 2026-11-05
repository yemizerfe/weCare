import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api'

function RequireAuth({ role, children }) {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const rolesKey = (Array.isArray(role) ? role : [role]).join(',')

  useEffect(() => {
    let active = true
    const roles = rolesKey.split(',')

    api.get('/auth/me')
      .then(({ data }) => {
        if (active) setStatus(roles.includes(data.user.role) ? 'allowed' : data.user.role)
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.response?.status === 401) {
          setStatus('signed-out')
        } else {
          setError(requestError.response?.data?.message || 'Unable to verify your account. Check your connection and try again.')
          setStatus('error')
        }
      })

    return () => { active = false }
  }, [rolesKey, attempt])

  if (status === 'loading') {
    return (
      <div className="auth-state">
        <div className="auth-state__card" role="status">
          <span className="auth-state__spinner" aria-hidden="true" />
          <p>Loading your weCare space...</p>
        </div>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="auth-state">
        <div className="auth-state__card" role="alert">
          <span className="auth-state__error" aria-hidden="true">!</span>
          <p>{error}</p>
          <div className="auth-state__actions">
        <button type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1) }} className="app-button app-button--primary">
          Try again
        </button>
        <Link to="/" className="auth-state__link">Return to the home page</Link>
          </div>
        </div>
      </div>
    )
  }
  if (status === 'signed-out') return <Navigate to="/" replace />
  if (status !== 'allowed') return <Navigate to={`/${status}`} replace />
  return children
}

export default RequireAuth
