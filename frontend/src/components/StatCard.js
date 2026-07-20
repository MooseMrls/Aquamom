import './StatCard.css';

export default function StatCard({ label, value, tone, hint }) {
  return (
    <div className={`stat-card ${tone ? 'stat-' + tone : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
