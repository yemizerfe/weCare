import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import api from '../api';

function SignUp({ onCloseClick }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState('');
  const [roleError, setRoleError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [caregiverCode, setCaregiverCode] = useState('');
  const [res, setRes] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      if (password.length < 8) {
        setPasswordError(true);
        return;
      }

      setPasswordError(false);

      if (password !== confirmPassword)
        return setShowConfirm(true);

      setShowConfirm(false);

      if (!role) {
        setRoleError(true);
        return;
      }

      setRoleError(false);




      await api.post('/auth/signup', {
        fullname: fullName,
        email,
        password,
        role,
        caregiverCode: role === 'patient' ? caregiverCode.trim() : undefined,
      });

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('');
      setCaregiverCode('');
      setRes('');

      if (role === 'patient') return navigate('/patient');

      return navigate('/caregiver');


    }
    catch (e) {
      setRes(e.response?.data?.message || 'Unable to create your account right now. Please try again.');
    }
  }

  return (
    <div className="auth-dialog">
      <form onSubmit={handleSignUp} className="auth-form">
        <div className="auth-form__top">
          <div>
            <span className="auth-form__eyebrow">YOUR CARE SPACE</span>
            <h2>Create your account</h2>
          </div>
          <button type="button" aria-label="Close sign up" className="auth-form__close" onClick={onCloseClick}>&times;</button>
        </div>
        <p className="auth-form__hint">Choose your role to get started.</p>
        <div className="auth-form__roles" role="group" aria-label="Choose your role">
          <button className={`auth-role${role === 'patient' ? ' auth-role--selected' : ''}`}
            type="button" aria-pressed={role === 'patient'} onClick={() => setRole('patient')}>
            <span aria-hidden="true">☺</span> Patient
          </button>
          <button className={`auth-role${role === 'caregiver' ? ' auth-role--selected' : ''}`}
            type="button" aria-pressed={role === 'caregiver'} onClick={() => setRole('caregiver')}>
            <span aria-hidden="true">✚</span> Caregiver
          </button>
        </div>

        <div className="auth-form__fields">
          <label htmlFor="name">Full name</label>
          <input type="text" autoComplete="name" maxLength={100} className="app-input"
            name='fullname'
            id='name'
            placeholder='John Doe Simpsons'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label htmlFor="Email">Email address</label>
          <input type="email" autoComplete="email" className="app-input"
            name='email'
            id='Email'
            placeholder='Johndoe@gmail.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="pass">Password</label>
          <input type="password" autoComplete="new-password" className="app-input"
            name='password'
            id='pass'
            placeholder='xxxxxxxx'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {role === 'patient' && (
            <>
              <label htmlFor="caregiverCode">Caregiver connection code (optional)</label>
              <input
                type="text"
                id="caregiverCode"
                value={caregiverCode}
                onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                maxLength={10}
                autoComplete="off"
                className="app-input"
                placeholder="Ask your caregiver for their code"
              />
            </>
          )}

          {passwordError && <p role="alert" className="form-message form-message--error">Password must be at least 8 characters long.</p>}

          <label htmlFor="confirmPass">Confirm password</label>
          <input type="password" autoComplete="new-password" className="app-input"
            id='confirmPass'
            placeholder='xxxxxxxx'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {showConfirm && <p role="alert" className="form-message form-message--error">Passwords must match.</p>}

          {roleError && <p role="alert" className="form-message form-message--error">Please select a role.</p>}

          <button type="submit" className="app-button app-button--primary auth-form__submit">
            Create account
          </button>
          {res && <p role="alert" className="form-message form-message--error">{res}</p>}
        </div>
      </form>
    </div>
  )
}

export default SignUp
