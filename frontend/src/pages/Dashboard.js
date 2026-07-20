import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatCard from '../components/StatCard.js';

const ACTION_LABELS = {
  registered: 'Registered',
  returned: 'Returned for refilling',
  assigned: 'Assigned to customer',
  delivered: 'Marked delivered',
  marked_undelivered: 'Marked undelivered',
  paid: 'Marked paid',
  marked_unpaid: 'Marked unpaid',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(errorMessage(err, 'Failed to load dashboard statistics.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Station Overview</h1>
          <p className="page-subtitle">Live monitoring of gallons coming in and going out.</p>
        </div>
        <Link to="/admin/scanner" className="btn btn-primary">
          Scan a Gallon
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && !stats && <div className="loading-block">Loading statistics...</div>}

      {stats && (
        <>
          <section className="stat-grid">
            <StatCard label="Total Gallons Tracked" value={stats.totalGallons} tone="navy" />
            <StatCard label="At Station" value={stats.atStation} tone="blue" hint="Returned, ready for refilling" />
            <StatCard label="With Customers" value={stats.withCustomer} tone="amber" hint="Currently out for use" />
            <StatCard label="Registered Customers" value={stats.totalCustomers} tone="navy" />
          </section>

          <section className="stat-grid">
            <StatCard label="Delivered" value={stats.delivered} tone="green" />
            <StatCard label="Undelivered" value={stats.undelivered} tone="red" />
            <StatCard label="Paid Gallons" value={stats.paid} tone="green" />
            <StatCard label="Unpaid Gallons" value={stats.unpaid} tone="red" />
          </section>

          <section className="highlight-banner">
            <div>
              <div className="highlight-label">Total Outstanding Balance</div>
              <div className="highlight-value">PHP {stats.unpaidBalance.toLocaleString()}</div>
            </div>
            <Link to="/admin/customers" className="btn btn-outline">
              View Unpaid Customers
            </Link>
          </section>

          <section className="panel">
            <h2>Recent Activity</h2>
            {stats.recentTransactions.length === 0 ? (
              <p className="empty-state">No activity recorded yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Gallon QR</th>
                    <th>Customer</th>
                    <th>Action</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="mono">{t.gallon?.qrCode || '-'}</td>
                      <td>{t.customer?.name || 'Unassigned'}</td>
                      <td>{ACTION_LABELS[t.action] || t.action}</td>
                      <td className="muted">{t.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
