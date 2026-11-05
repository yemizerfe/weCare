import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import api from '../api';

function SignIn({ onCloseClick }) {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [roleError, setRoleError] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [res, setRes] = useState('');


    const handleSignIn = async (e) => {
        e.preventDefault();

        if (!role) {
            setRoleError(true);
            return;
        }

        setRoleError(false);
        setRes('');

        try {

            await api.post('/auth/signin', {
                email,
                password,
                role

            });

            setEmail('');
            setPassword('');

            if (role == 'patient')
                return navigate('/patient');

            else if (role == 'caregiver')
                return navigate('/caregiver');
        }
        catch (e) {
            setRes(e.response?.data?.message || 'Unable to sign in right now. Please try again.');
        }


    }


    return (

        <div className="auth-dialog">
            <form onSubmit={handleSignIn} className="auth-form">
                <div className="auth-form__top">
                    <div>
                        <span className="auth-form__eyebrow">WELCOME BACK</span>
                        <h2>Sign in to weCare</h2>
                    </div>
                    <button type="button" aria-label="Close sign in" className="auth-form__close" onClick={onCloseClick}>&times;</button>
                </div>
                <p className="auth-form__hint">First, tell us how you use weCare.</p>
                <div className="auth-form__roles" role="group" aria-label="Choose your role">
                    <button className={`auth-role${role === 'patient' ? ' auth-role--selected' : ''}`}
                        type="button"
                        aria-pressed={role === 'patient'}
                        onClick={() => setRole('patient')}
                    ><span aria-hidden="true">☺</span> Patient
                    </button>
                    <button className={`auth-role${role === 'caregiver' ? ' auth-role--selected' : ''}`}
                        type="button"
                        aria-pressed={role === 'caregiver'}
                        onClick={() => setRole('caregiver')}
                    ><span aria-hidden="true">✚</span> Caregiver
                    </button>
                </div>

                <div className="auth-form__fields">
                    <label htmlFor="Email">Email address</label>
                    <input type="email" autoComplete="email" className="app-input"
                        name='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        id='Email'
                        placeholder='Johndoe@gmail.com'
                        required
                    />

                    <label htmlFor="pass">Password</label>
                    <input type="password" autoComplete="current-password" className="app-input"
                        name='password'
                        id='pass'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='xxxxxxxx'
                        required
                    />

                    {roleError && <p role="alert" className="form-message form-message--error">Please select a role.</p>}

                    <button type="submit" className="app-button app-button--primary auth-form__submit">
                        Sign in
                    </button>

                    {res && <p role="alert" className="form-message form-message--error">{res}</p>}
                </div>
            </form>
        </div>
    )
}







export default SignIn
