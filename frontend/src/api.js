import axios from 'axios';
import { getToken, clearToken } from './utils/auth.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://aquamom.onrender.com/api' : 'http://localhost:5001/api'),
  headers: { 'Content-Type': 'application/json' },
});

// Attach the admin session token, when present, to every request.
// Requests from the public customer-lookup pages simply won't have one.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the admin session has expired or been revoked, clear it and send
// the admin back to the login screen instead of leaving them stuck on
// a broken page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      clearToken();
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err, fallback) {
  return err?.response?.data?.message || fallback || 'Something went wrong. Please try again.';
}

export default api;
