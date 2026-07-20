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
          <BrandMark tagline="Staff Console" onLight />
        </div>

        <h1>Sign in</h1>
        <p className="page-subtitle">Access the gallon tracking and customer management console.</p>

        <form onSubmit={submit} className="form">
          {error && <div className="alert alert-error">{error}</div>}
          <label>
            Username
            <input
              className="input"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <a className="auth-back-link" href="/">
          &larr; Back to customer lookup
        </a>
      </div>
    </div>
  );
}
