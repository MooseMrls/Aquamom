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

  const handleClear = () => {
    setName('');
    setResults(null);
    setError('');
    setSearched(false);
  };

  return (
    <div className="page lookup-page">
      <div className="lookup-header">
        <h1 className="lookup-title">Check Your Gallon Status</h1>
        <p className="page-subtitle lookup-subtitle">
          Enter your full name to quickly verify the status of your gallons, active deliveries, and outstanding balances.
        </p>
      </div>

      <div className="lookup-form-wrapper">
        <form className="lookup-form" onSubmit={search}>
          <div className="lookup-input-container">
            <input
              className="input lookup-input"
              placeholder="Enter your full name (e.g. Tin)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {name && (
              <button
                type="button"
                className="lookup-input-clear"
                onClick={handleClear}
                title="Clear input"
                aria-label="Clear input"
              >
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                  <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <div className="lookup-form-actions">
            <button className="btn btn-primary lookup-btn" type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            {(searched || results !== null) && (
              <button className="btn btn-outline lookup-clear-btn" type="button" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error lookup-alert">{error}</div>}

      {searched && !loading && !error && results && results.length === 0 && (
        <div className="panel lookup-empty-state">
          <svg className="lookup-empty-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 8v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3>No Records Found</h3>
          <p className="muted lookup-empty-text">
            We couldn't find any active customer profile for "{name}". Please check the spelling or visit the refilling station.
          </p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="lookup-results">
          {results.map((r) => (
            <div className="panel lookup-card" key={r.customer._id}>
              <div className="lookup-profile-header">
                <h2>{r.customer.name}</h2>
                <span className="badge badge-blue">Verified Profile</span>
              </div>
              
              <div className="lookup-summary">
                <div className="lookup-stat-card">
                  <div className="highlight-label">Total Gallons</div>
                  <div className="highlight-value navy">{r.totalGallons}</div>
                </div>
                <div className="lookup-stat-card">
                  <div className="highlight-label">Undelivered</div>
                  <div className="highlight-value navy">{r.undeliveredGallons.length}</div>
                </div>
                <div className="lookup-stat-card">
                  <div className="highlight-label">Unpaid Balance</div>
                  <div className={`highlight-value ${r.unpaidBalance > 0 ? 'danger' : 'success'}`}>
                    ₱{r.unpaidBalance}
                  </div>
                </div>
              </div>

              <div className="lookup-section">
                <h3 className="lookup-section-title">
                  <svg className="lookup-icon teal" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 6.5h13M3.5 10h13M3.5 13.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Undelivered Refills
                </h3>
                {r.undeliveredGallons.length === 0 ? (
                  <p className="muted lookup-empty-msg">All of your refilled gallons have been successfully delivered. Thank you!</p>
                ) : (
                  <ul className="lookup-list">
                    {r.undeliveredGallons.map((g) => (
                      <li key={g._id} className="lookup-list-item">
                        <span className="mono qr-badge">{g.qrCode}</span>
                        <span className="lookup-date">
                          Updated {new Date(g.updatedAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="lookup-section">
                <h3 className="lookup-section-title">
                  <svg className="lookup-icon amber" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6v5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Unpaid Balances
                </h3>
                {r.unpaidGallons.length === 0 ? (
                  <p className="muted lookup-empty-msg">You have no outstanding balances. Thank you for your support!</p>
                ) : (
                  <ul className="lookup-list">
                    {r.unpaidGallons.map((g) => (
                      <li key={g._id} className="lookup-list-item">
                        <span className="mono qr-badge">{g.qrCode}</span>
                        <span className="lookup-price">₱{g.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
