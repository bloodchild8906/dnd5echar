import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../../components/common/SectionCard';
import { useAuth } from '../../context/AuthContext';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { configured, loading, signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  if (!configured) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Authentication</p>
            <h1>Supabase configuration required</h1>
            <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable authenticated cloud collaboration.</p>
          </div>
        </section>
      </div>
    );
  }

  if (user) {
    navigate('/games');
  }

  return (
    <div className="page-stack page-stack--narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">Authentication</p>
          <h1>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
          <p>Email/password auth powers private character ownership, game membership, and GM role management.</p>
        </div>
      </section>
      <SectionCard title={mode === 'signin' ? 'Sign In' : 'Create Account'}>
        <div className="form-grid">
          {mode === 'signup' ? (
            <label>
              Display Name
              <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
          ) : null}
          <label>
            Email
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
        </div>
        {message ? <p className="callout">{message}</p> : null}
        <div className="button-row">
          <button
            type="button"
            className="button"
            disabled={loading}
            onClick={async () => {
              try {
                if (mode === 'signin') {
                  await signIn(email, password);
                  navigate('/games');
                } else {
                  await signUp(email, password, displayName);
                  setMessage('Account created. If email confirmation is enabled, confirm your email before signing in.');
                  setMode('signin');
                }
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Authentication failed.');
              }
            }}
          >
            {loading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
          <button type="button" className="button button--ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};
