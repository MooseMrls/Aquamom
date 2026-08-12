import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { isAuthenticated, setToken } from '../utils/auth.js';
import BrandMark from '../components/BrandMark.js';
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
        <div className="auth-brand">
          <BrandMark tagline="Staff Console" onLight size="lg" />
        </div>

        <h1>Welcome Back</h1>
        <p className="page-subtitle">Access the gallon tracking and customer management console.</p>

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
          &larr; Back to customer lookup
        </a>
      </div>
    </div>
  );
}
