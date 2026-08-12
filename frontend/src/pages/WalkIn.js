import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import './WalkIn.css';

export default function WalkIn() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Form states
  const [size, setSize] = useState('Round');
  const [customSize, setCustomSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSales = () => {
    setLoading(true);
    api
      .get('/walkins?todayOnly=true')
      .then((res) => setSales(res.data))
      .catch((err) => setError(errorMessage(err, 'Failed to load walk-in sales.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      await api.post('/walkins', {
        size: size === 'Custom' ? customSize : size,
        quantity: Number(quantity),
        pricePerUnit: Number(pricePerUnit),
        note,
      });
      setNotice('Walk-in sale recorded successfully.');
      setQuantity(1);
      setNote('');
      setCustomSize('');
      loadSales();
    } catch (err) {
      setError(errorMessage(err, 'Failed to record sale.'));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = Number(quantity || 0) * Number(pricePerUnit || 0);
  const todayTotal = sales.reduce((sum, s) => sum + (s.walkInDetails?.totalAmount || 0), 0);
  const todayGallons = sales.reduce((sum, s) => sum + (s.walkInDetails?.quantity || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Walk-in</h1>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Today's Quick Stats */}
      <div className="walkin-stats-row">
        <div className="walkin-stat-chip">
          <span className="walkin-stat-chip-label">Today's Walk-in Revenue</span>
          <span className="walkin-stat-chip-value" style={{ color: 'var(--green-600)' }}>₱{todayTotal.toLocaleString()}</span>
        </div>
        <div className="walkin-stat-chip">
          <span className="walkin-stat-chip-label">Transactions</span>
          <span className="walkin-stat-chip-value">{sales.length}</span>
        </div>
      </div>

      <div className="walkin-layout">
        {/* Left: New Sale Form */}
        <div className="panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
            <svg style={{ width: '20px', height: '20px', color: 'var(--teal-600)' }} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 10.5c.5-2 1.5-3 3.5-3s3 1 3.5 3L14.5 17h-2l-1-4h-3l-1 4h-2l1.5-6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            New Walk-in Refill
          </h2>
          <form onSubmit={handleSubmit} className="walkin-form">
            <div className="form-row">
              <label>
                Gallon Size
                <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="Round">Round</option>
                  <option value="Slim">Slim</option>
                  <option value="Custom">Custom...</option>
                </select>
              </label>

              {size === 'Custom' && (
                <label>
                  Custom Size Name
                  <input className="input" value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="e.g. 5 Liters" required />
                </label>
              )}

              <label>
                Price per Unit (₱)
                <input className="input" type="number" min="0" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} required />
              </label>
            </div>

            {/* Quantity Control */}
            <label>
              Quantity
              <div className="walkin-qty-control">
                <button type="button" className="walkin-qty-btn" onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))}>−</button>
                <input className="input walkin-qty-input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                <button type="button" className="walkin-qty-btn" onClick={() => setQuantity(Number(quantity) + 1)}>+</button>
              </div>
            </label>

            {/* Receipt Summary */}
            <div className="walkin-receipt">
              <div className="walkin-receipt-row">
                <span>{quantity}x {size === 'Custom' ? (customSize || 'Custom') : size}</span>
                <span>₱{pricePerUnit} each</span>
              </div>
              <div className="walkin-receipt-total">
                <span>Total</span>
                <span>₱{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <label>
              Note (optional)
              <input className="input" type="text" placeholder="e.g. Paid in cash, customer returned a clean gallon" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: '8px' }}>
              {submitting ? 'Recording...' : 'Record'}
            </button>
          </form>
        </div>

        {/* Right: Today's Sales List */}
        <div className="panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Walk-in Sales Today</h2>
          {loading && sales.length === 0 ? (
            <p className="loading-block">Loading today's sales...</p>
          ) : sales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <svg style={{ width: '40px', height: '40px', color: 'var(--muted)', marginBottom: '12px' }} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <p className="muted" style={{ fontSize: '0.9rem' }}>No walk-in sales recorded today yet.</p>
            </div>
          ) : (
            <div className="walkin-sales-list">
              {sales.map((s) => (
                <div key={s._id} className="walkin-sale-item">
                  <div className="walkin-sale-item-top">
                    <span className="walkin-sale-time">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <strong>{s.walkInDetails?.quantity}× {s.walkInDetails?.size}</strong>
                    <span className="walkin-sale-amount">₱{s.walkInDetails?.totalAmount}</span>
                  </div>
                  {s.note && <div className="walkin-sale-note">{s.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
