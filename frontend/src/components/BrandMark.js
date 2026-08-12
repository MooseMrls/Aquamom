import './BrandMark.css';
import amLogo from '../img/amlogo.png';

// Aquamom's signature mark: every "logo" in the app — sidebar, customer
// header, auth card — renders this same image so the brand reads as one
// consistent water-refilling identity rather than a generic lettered badge.
function Droplet() {
  return <img src={amLogo} alt="Aquamom logo" />;
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