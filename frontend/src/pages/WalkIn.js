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
  const [pricePerUnit, setPricePerUnit] = useState(25);
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Walk-in Sales</h1>
          <p className="page-subtitle">Record quick, non-registered gallon refills and cash sales.</p>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="walkin-layout">
        <div className="panel">
          <h2>New Walk-in Refill</h2>
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
                  <input
                    className="input"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="e.g. 5 Liters"
                    required
                  />
                </label>
              )}

              <label>
                Price per Unit (PHP)
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Quantity
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </label>

              <label className="total-display-cell">
                Total Price
                <div className="total-price-text">PHP {totalPrice}</div>
              </label>
            </div>

            <label>
              Note (optional)
              <input
                className="input"
                type="text"
                placeholder="e.g. Paid in cash, customer returned a clean gallon"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Walk-in Sale'}
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Walk-in Sales Today</h2>
          {loading && sales.length === 0 ? (
            <p className="loading-state">Loading sales...</p>
          ) : sales.length === 0 ? (
            <p className="empty-state">No walk-in sales recorded today yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Details</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s._id}>
                      <td>{new Date(s.createdAt).toLocaleTimeString()}</td>
                      <td>
                        <strong>{s.walkInDetails?.quantity}x {s.walkInDetails?.size}</strong>
                        <div className="note-subtext muted">{s.note}</div>
                      </td>
                      <td>PHP {s.walkInDetails?.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
