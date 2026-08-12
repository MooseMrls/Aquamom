import { useId } from 'react';
import './BrandMark.css';

// The droplet is Aquamom's signature mark: every "logo" in the app —
// sidebar, customer header, auth card — renders this same shape so the
// brand reads as one consistent water-refilling identity rather than a
// generic lettered badge.
//
// On mobile this component can render twice at once (compact top bar +
// off-canvas drawer), so the gradient id is made unique per instance via
// useId to avoid duplicate-id collisions in the DOM.
function Droplet() {
  const gradientId = `droplet-gradient-${useId()}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 2.5c3.2 4.4 6.2 8.4 6.2 12A6.2 6.2 0 0 1 5.8 14.5c0-3.6 3-7.6 6.2-12Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M8.3 14.2c.5 1.9 2 3.1 3.9 3.1"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="5.8" y1="2.5" x2="18.2" y2="20.7" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--cyan-400)" />
          <stop offset="1" stopColor="var(--teal-700)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function BrandMark({ name = 'Aquamom', tagline, size = 'md', onLight = false }) {
  const classes = ['brand-mark-group', `brand-mark-${size}`, onLight ? 'brand-mark-on-light' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes}>
      <span className="brand-mark">
        <Droplet />
      </span>
      <div>
        <div className="brand-name">{name}</div>
        {tagline && <div className="brand-tagline">{tagline}</div>}
      </div>
    </div>
  );
}