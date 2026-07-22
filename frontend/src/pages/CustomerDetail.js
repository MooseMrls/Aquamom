import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';

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

  if (loading) return <div className="page"><div className="loading-block">Loading customer...</div></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  const quickToggle = async (gallon, field, value) => {
    if (!gallon) return;
    try {
      await api.patch(`/gallons/${gallon._id}`, { [field]: value });
      // Refresh customer data
      const res = await api.get(`/customers/${id}`);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  const { customer, gallons } = data;
  const unpaidBalance = gallons.filter((g) => g.paymentStatus === 'unpaid').reduce((sum, g) => sum + g.price, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/admin/customers" className="back-link">&larr; Back to Customers</Link>
          <h1>{customer.name}</h1>
          <p className="page-subtitle">
            {customer.address || 'No address on file'}
          </p>
        </div>
      </div>

      <div className="highlight-banner">
        <div>
          <div className="highlight-label">Outstanding Balance</div>
          <div className="highlight-value">PHP {unpaidBalance.toLocaleString()}</div>
        </div>
        <div className="highlight-label">{gallons.length} gallon record(s) on file</div>
      </div>

      <div className="panel">
        <h2>Gallon History</h2>
        {gallons.length === 0 ? (
          <p className="empty-state">This customer has no gallon records yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>QR Code</th>
                <th>Size</th>
                <th>Price</th>
                <th>Location</th>
                <th>Delivery</th>
                <th>Payment</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {gallons.map((g) => (
                <tr key={g._id}>
                  <td className="mono">{g.qrCode}</td>
                  <td>{g.size}</td>
                  <td>PHP {g.price}</td>
                  <td><StatusBadge status={g.locationStatus} /></td>
                  <td>
                    <button
                      className="badge-button"
                      onClick={() => quickToggle(g, 'deliveryStatus', g.deliveryStatus === 'delivered' ? 'undelivered' : 'delivered')}
                      title="Click to toggle delivery status"
                    >
                      <StatusBadge status={g.deliveryStatus} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="badge-button"
                      onClick={() => quickToggle(g, 'paymentStatus', g.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                      title="Click to toggle payment status"
                    >
                      <StatusBadge status={g.paymentStatus} />
                    </button>
                  </td>
                  <td className="muted">
                    {new Date(g.updatedAt).toLocaleDateString()} {new Date(g.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
