import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';
import './CustomerDetail.css';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/customers/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Failed to load customer.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="loading-block">Loading customer profile...</div></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  const quickToggle = async (gallon, field, value) => {
    if (!gallon) return;
    try {
      await api.patch(`/gallons/${gallon._id}`, { [field]: value });
      const res = await api.get(`/customers/${id}`);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  const { customer, gallons } = data;
  const unpaidBalance = gallons.filter((g) => g.paymentStatus === 'unpaid').reduce((sum, g) => sum + g.price, 0);
  const deliveredCount = gallons.filter((g) => g.deliveryStatus === 'delivered').length;
  const paidCount = gallons.filter((g) => g.paymentStatus === 'paid').length;

  return (
    <div className="page">
      <Link to="/admin/customers" className="back-link">
        <svg viewBox="0 0 20 20" fill="none" style={{ width: '14px', height: '14px' }}><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Customers
      </Link>

      <div className="cd-layout">
        {/* Profile Sidebar */}
        <div className="cd-profile-card">
          <h1 className="cd-name">{customer.name}</h1>
          <p className="cd-address">{customer.address || 'No address on file'}</p>

          <div className="cd-stats">
            <div className="cd-stat">
              <span className="cd-stat-value">{gallons.length}</span>
              <span className="cd-stat-label">Total Gallons</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-value">{deliveredCount}</span>
              <span className="cd-stat-label">Delivered</span>
            </div>
            <div className="cd-stat">
              <span className="cd-stat-value">{paidCount}</span>
              <span className="cd-stat-label">Paid</span>
            </div>
          </div>

          <div className="cd-balance-block">
            <span className="cd-balance-label">Outstanding Balance</span>
            <span className={`cd-balance-value ${unpaidBalance > 0 ? 'text-danger' : ''}`}>
              ₱{unpaidBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Gallon History */}
        <div className="cd-history">
          <div className="panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '20px' }}>Gallon History</h2>
            {gallons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <svg style={{ width: '40px', height: '40px', color: 'var(--muted)', marginBottom: '12px' }} viewBox="0 0 20 20" fill="none"><path d="M7 2.5h6l.6 2.8a5.6 5.6 0 0 1 2.4 4.6c0 3.6-2.7 6.6-6 6.6s-6-3-6-6.6a5.6 5.6 0 0 1 2.4-4.6L7 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                <p className="muted">This customer has no gallon records yet.</p>
              </div>
            ) : (
              <div className="cd-gallon-list">
                {gallons.map((g) => (
                  <div key={g._id} className="cd-gallon-item">
                    <div className="cd-gallon-header">
                      <div className="cd-gallon-title-group">
                        <div className="cd-gallon-code-row">
                          <span className="mono activity-qr-badge">{g.qrCode}</span>
                          <span className="cd-gallon-size">&bull; {g.size}</span>
                          <span className="cd-gallon-price">&bull; ₱{g.price}</span>
                        </div>
                        <div className="cd-gallon-badges">
                          <StatusBadge status={g.locationStatus} />
                          <StatusBadge status={g.deliveryStatus} />
                          <StatusBadge status={g.paymentStatus} />
                        </div>
                      </div>
                      <div className="cd-gallon-actions">
                        <button
                          className="btn-icon btn-icon-delivery"
                          data-tooltip={g.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'}
                          title={g.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'}
                          onClick={() => quickToggle(g, 'deliveryStatus', g.deliveryStatus === 'delivered' ? 'undelivered' : 'delivered')}
                        >
                          {g.deliveryStatus === 'delivered' ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 10.5l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                        <button
                          className="btn-icon btn-icon-payment"
                          data-tooltip={g.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          title={g.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          onClick={() => quickToggle(g, 'paymentStatus', g.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                        >
                          {g.paymentStatus === 'paid' ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8M15 5L5 15"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="cd-gallon-timestamp">
                      Updated {new Date(g.updatedAt).toLocaleDateString()} {new Date(g.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
