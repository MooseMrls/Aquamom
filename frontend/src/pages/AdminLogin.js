import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { isAuthenticated, setToken } from '../utils/auth.js';
import amLogo from '../img/amlogo.png';
import './AdminLogin.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      setToken(res.data.token);
      const redirectTo = location.state?.from?.pathname || '/admin';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Invalid username or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card-inner">

          {/* Brand — logo stacked above name, fully centered */}
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <img src={amLogo} alt="Aquamom logo" />
            </div>
            <div className="auth-brand-text">
              <div className="auth-brand-name">Aquamom</div>
              <div className="auth-brand-tagline">Admin Console</div>
            </div>
          </div>

          <h1>Welcome Back</h1>
          <p className="auth-subtitle"></p>

          <form onSubmit={submit} className="form">
            {error && <div className="alert alert-error">{error}</div>}

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '16px', height: '16px', color: 'var(--muted)' }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 17c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Username
              </span>
              <input
                className="input"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
              />
            </label>

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '16px', height: '16px', color: 'var(--muted)' }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 9V6a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Password
              </span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </label>

            <button className="btn btn-primary btn-block mt-md" type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg className="animate-spin" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.25 }} />
                    <path d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <a className="auth-back-link" href="/">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M13 16l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to customer lookup
          </a>

        </div>
      </div>
    </div>
  );
}
