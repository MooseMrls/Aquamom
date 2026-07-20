import { useState } from 'react';
import api, { errorMessage } from '../api.js';
import './PublicLookup.css';

export default function PublicLookup() {
  const [name, setName] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await api.get('/customers/lookup', { params: { name: name.trim() } });
      setResults(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to look up your records.'));
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Check Your Gallon Status</h1>
          <p className="page-subtitle">
            Enter your full name to check the gallons you have given us, including delivery and payment status.
          </p>
        </div>
      </div>

      <form className="lookup-form" onSubmit={search}>
        <input
          className="input"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {searched && !loading && !error && results && results.length === 0 && (
        <p className="empty-state">
          No records found for that name. Please check the spelling or contact the station directly.
        </p>
      )}

      {results && results.length > 0 && (
        <div className="lookup-results">
          {results.map((r) => (
            <div className="panel" key={r.customer._id}>
              <h2>{r.customer.name}</h2>
              <div className="lookup-summary">
                <div>
                  <div className="highlight-label">Total Gallons</div>
                  <div className="highlight-value">{r.totalGallons}</div>
                </div>
                <div>
                  <div className="highlight-label">Undelivered</div>
                  <div className="highlight-value">{r.undeliveredGallons.length}</div>
                </div>
                <div>
                  <div className="highlight-label">Unpaid Balance</div>
                  <div className="highlight-value">PHP {r.unpaidBalance.toLocaleString()}</div>
                </div>
              </div>

              <h3>Undelivered Gallons</h3>
              {r.undeliveredGallons.length === 0 ? (
                <p className="muted">All of your gallons have been delivered.</p>
              ) : (
                <ul className="lookup-list">
                  {r.undeliveredGallons.map((g) => (
                    <li key={g._id}>
                      <span className="mono">{g.qrCode}</span> &mdash; still undelivered
                      (updated {new Date(g.updatedAt).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              )}

              <h3>Unpaid Gallons</h3>
              {r.unpaidGallons.length === 0 ? (
                <p className="muted">You have no unpaid balance. Thank you.</p>
              ) : (
                <ul className="lookup-list">
                  {r.unpaidGallons.map((g) => (
                    <li key={g._id}>
                      <span className="mono">{g.qrCode}</span> &mdash; PHP {g.price} unpaid
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
