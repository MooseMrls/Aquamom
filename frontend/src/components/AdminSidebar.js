import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../utils/auth.js';
import BrandMark from './BrandMark.js';
import './AdminSidebar.css';

const icons = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="9.5" width="6.5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="12.5" width="6.5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  gallons: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 2.5h6l.6 2.8a5.6 5.6 0 0 1 2.4 4.6c0 3.6-2.7 6.6-6 6.6s-6-3-6-6.6a5.6 5.6 0 0 1 2.4-4.6L7 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.6 10.5c1 .8 1.9.8 2.8 0s1.8-.8 2.8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  scanner: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6.5v-2A1.5 1.5 0 0 1 4.5 3h2M13.5 3h2A1.5 1.5 0 0 1 17 4.5v2M17 13.5v2a1.5 1.5 0 0 1-1.5 1.5h-2M6.5 17h-2A1.5 1.5 0 0 1 3 15.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="7" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.2" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 16c.4-2.8 2.2-4.5 4.4-4.5s4 1.7 4.4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 11.7c1.8.2 3.1 1.7 3.4 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5.5h14M3 10h14M3 14.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.5" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  today: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),
  walkin: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.5c.5-2 1.5-3 3.5-3s3 1 3.5 3L14.5 17h-2l-1-4h-3l-1 4h-2l1.5-6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 13H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3H5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 5 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 13.5 16 10l-3.5-3.5M16 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/scanner', label: 'Scanner', icon: 'scanner' },
  { to: '/admin/walkin', label: 'Walk-in', icon: 'walkin' },
  { to: '/admin/gallons', label: 'Gallons', icon: 'gallons' },
  { to: '/admin/customers', label: 'Customers', icon: 'customers' },
  { to: '/admin/transactions', label: 'Transactions', icon: 'transactions' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes (e.g. after tapping a link).
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const logout = () => {
    clearToken();
    navigate('/admin/login', { replace: true });
  };

  const sidebarLinks = (
    <>
      <div className="sidebar-brand">
        <BrandMark tagline="Admin Console" />
      </div>

      <nav className="sidebar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">{icons[link.icon]}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={logout}>
        <span className="sidebar-link-icon">{icons.logout}</span>
        Sign Out
      </button>
    </>
  );

  return (
    <>
      {/* Compact fixed header shown only on mobile widths, with the
          hamburger button that opens the off-canvas drawer below. */}
      <div className="sidebar-topbar">
        <BrandMark tagline="Admin Console" />
        <button
          type="button"
          className="sidebar-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <span className="sidebar-link-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>

      {/* Dark backdrop behind the open drawer (mobile only). */}
      <div
        className={'sidebar-overlay' + (open ? ' open' : '')}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside className={'sidebar' + (open ? ' open' : '')}>
        {sidebarLinks}
      </aside>
    </>
  );
}