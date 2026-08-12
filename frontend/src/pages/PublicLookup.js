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
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Check Your Gallon Status</h1>
          <p className="page-subtitle" style={{ margin: '0 auto', maxWidth: '500px' }}>
            Enter your full name to quickly verify the status of your gallons, active deliveries, and outstanding balances.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto 32px' }}>
        <form className="lookup-form" onSubmit={search}>
          <input
            className="input"
            placeholder="Enter your full name (e.g. John Doe)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '14px 18px', fontSize: '1rem' }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '0 24px' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error" style={{ maxWidth: '520px', margin: '0 auto 20px' }}>{error}</div>}

      {searched && !loading && !error && results && results.length === 0 && (
        <div className="panel" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--muted)', marginBottom: '16px' }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 8v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3>No Records Found</h3>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: '6px' }}>
            We couldn't find any active customer profile for "{name}". Please check the spelling or visit the refilling station.
          </p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="lookup-results" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {results.map((r) => (
            <div className="panel" key={r.customer._id} style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{r.customer.name}</h2>
                <span className="badge badge-blue">Verified Profile</span>
              </div>
              
              <div className="lookup-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div className="highlight-label">Total Gallons</div>
                  <div className="highlight-value" style={{ fontSize: '1.8rem', color: 'var(--navy-900)' }}>{r.totalGallons}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div className="highlight-label">Undelivered</div>
                  <div className="highlight-value" style={{ fontSize: '1.8rem', color: 'var(--navy-900)' }}>{r.undeliveredGallons.length}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <div className="highlight-label">Unpaid Balance</div>
                  <div className="highlight-value" style={{ fontSize: '1.8rem', color: r.unpaidBalance > 0 ? 'var(--red-600)' : 'var(--green-600)' }}>
                    ₱{r.unpaidBalance}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '18px', height: '18px', color: 'var(--teal-600)' }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 6.5h13M3.5 10h13M3.5 13.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Undelivered Refills
                </h3>
                {r.undeliveredGallons.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.9rem', paddingLeft: '4px' }}>All of your refilled gallons have been successfully delivered. Thank you!</p>
                ) : (
                  <ul className="lookup-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {r.undeliveredGallons.map((g) => (
                      <li key={g._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--paper)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <span className="mono" style={{ fontSize: '0.85rem' }}>{g.qrCode}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          Updated {new Date(g.updatedAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '18px', height: '18px', color: 'var(--amber-600)' }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6v5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Unpaid Balances
                </h3>
                {r.unpaidGallons.length === 0 ? (
                  <p className="muted" style={{ fontSize: '0.9rem', paddingLeft: '4px' }}>You have no outstanding balances. Thank you for your support!</p>
                ) : (
                  <ul className="lookup-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {r.unpaidGallons.map((g) => (
                      <li key={g._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--paper)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <span className="mono" style={{ fontSize: '0.85rem' }}>{g.qrCode}</span>
                        <span style={{ fontWeight: '600', color: 'var(--red-600)', fontSize: '0.9rem' }}>₱{g.price}</span>
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
