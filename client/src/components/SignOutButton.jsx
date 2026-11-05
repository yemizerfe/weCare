import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function SignOutButton() {
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const signOut = async () => {
    try {
      await api.post('/auth/signout')
      navigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign out. Please try again.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
      <button type="button" onClick={signOut} className="app-signout">
        <span aria-hidden="true">↗</span> Sign out
      </button>
    </div>
  )
}

export default SignOutButton
