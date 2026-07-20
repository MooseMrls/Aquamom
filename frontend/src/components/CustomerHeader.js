import BrandMark from './BrandMark.js';
import './CustomerHeader.css';

export default function CustomerHeader() {
  return (
    <header className="customer-header">
      <div className="customer-header-inner">
        <BrandMark tagline="Water Refilling Station" />
      </div>
      {/* Signature wave — the one place the water motif gets to be literal */}
      <svg className="customer-header-wave" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 22c180-18 360-18 540 0s360 24 540 6 300-20 360-10V40H0Z" fill="var(--paper)" />
      </svg>
    </header>
  );
}
