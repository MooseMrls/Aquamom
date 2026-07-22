import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatCard from '../components/StatCard.js';
import StatusBadge from '../components/StatusBadge.js';
import './Today.css';

const ACTION_LABELS = {
  registered: 'Registered',
  returned: 'Returned for refilling',
  assigned: 'Assigned to customer',
  delivered: 'Marked delivered',
  marked_undelivered: 'Marked undelivered',
  paid: 'Marked paid',
  marked_unpaid: 'Marked unpaid',
  walkin_sale: 'Walk-in Sale',
};

const ACTION_CLASSES = {
  registered: 'badge-registered',
  returned: 'badge-returned',
  assigned: 'badge-assigned',
  delivered: 'badge-delivered',
  marked_undelivered: 'badge-undelivered',
  paid: 'badge-paid',
  marked_unpaid: 'badge-unpaid',
  walkin_sale: 'badge-walkin',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard'),
      api.get('/transactions/today')
    ])
      .then(([dashboardRes, todayRes]) => {
        setStats(dashboardRes.data);
        setTodayData(todayRes.data);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load dashboard data.')))
      .finally(() => setLoading(false));
  };

  const quickToggle = async (gallon, field, value) => {
    if (!gallon) return;
    try {
      await api.patch(`/gallons/${gallon._id}`, { [field]: value });
      load();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
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
          <h1>Today's Summary</h1>
          <p className="page-subtitle">Live daily performance overview and transactions.</p>
        </div>
        {/* <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            Refresh
          </button>
          <Link to="/admin/scanner" className="btn btn-primary">
            Scan a Gallon
          </Link>
        </div> */}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && !stats && !todayData && <div className="loading-block">Loading dashboard data...</div>}

      {todayData && (
        <div className="today-stats-grid">
          <StatCard
            label="Gallons for Refill"
            value={todayData.totalRefillsIncludingWalkIn}
            hint={`${todayData.refillsCount} registered, ${todayData.walkInGallonsCount} walk-in`}
            tone="blue"
          />
          <StatCard
            label="Delivered"
            value={todayData.deliveriesCount}
            hint="Active gallons delivered today"
          />
          <StatCard
            label="Paid"
            value={todayData.paidCount}
            hint="Active gallons paid today"
          />
          <StatCard
            label="Unpaid"
            value={todayData.unpaidCount}
            hint="Active gallons unpaid today"
          />
          <StatCard
            label="Total Daily Revenue"
            value={`PHP ${todayData.totalRevenue}`}
            hint="Walk-in & registered payments"
            tone="good"
          />
        </div>
      )}

      {stats && (
        <section className="highlight-banner" style={{ marginBottom: '28px' }}>
          <div>
            <div className="highlight-label">Total Outstanding Balance</div>
            <div className="highlight-value">PHP {stats.unpaidBalance.toLocaleString()}</div>
          </div>
          <Link to="/admin/customers" className="btn btn-outline">
            View Unpaid Customers
          </Link>
        </section>
      )}

      {todayData && (() => {
        const uniqueGallonsMap = {};
        const walkIns = [];

        todayData.transactions.forEach((t) => {
          if (t.isWalkIn) {
            walkIns.push(t);
          } else if (t.gallon) {
            const gallonId = t.gallon._id;
            if (!uniqueGallonsMap[gallonId]) {
              uniqueGallonsMap[gallonId] = {
                ...t.gallon,
                customer: t.customer,
                latestAction: t.action,
                latestTime: t.createdAt,
                note: t.note,
              };
            }
          }
        });

        const displayRows = [
          ...Object.values(uniqueGallonsMap).map((g) => ({
            id: g._id,
            isWalkIn: false,
            qrCode: g.qrCode,
            customerName: g.customer?.name || 'Unassigned',
            size: g.size,
            price: g.price,
            locationStatus: g.locationStatus,
            deliveryStatus: g.deliveryStatus,
            paymentStatus: g.paymentStatus,
            latestAction: g.latestAction,
            time: g.latestTime,
            note: g.note,
            gallonObj: g,
          })),
          ...walkIns.map((w) => ({
            id: w._id,
            isWalkIn: true,
            qrCode: '-',
            customerName: 'Walk-in Customer',
            size: w.walkInDetails?.size || '-',
            price: w.walkInDetails?.totalAmount || 0,
            locationStatus: 'at_station',
            deliveryStatus: 'delivered',
            paymentStatus: 'paid',
            latestAction: 'walkin_sale',
            time: w.createdAt,
            note: w.note || `Walk-in Sale (${w.walkInDetails?.quantity} pcs)`,
            gallonObj: null,
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        return (
          <section className="panel list-panel">
            <h2>Today's Active Gallons & Sales ({displayRows.length})</h2>
            {displayRows.length === 0 ? (
              <p className="empty-state">No activity recorded today yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Latest Time</th>
                    <th>Gallon QR</th>
                    <th>Customer</th>
                    <th>Size/Price</th>
                    <th>Delivery</th>
                    <th>Payment</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.time).toLocaleTimeString()}</td>
                      <td className="mono">{row.qrCode}</td>
                      <td>{row.customerName}</td>
                      <td>{row.size} (PHP {row.price})</td>
                      <td>
                        {row.gallonObj ? (
                          <button
                            className="badge-button"
                            onClick={() => quickToggle(row.gallonObj, 'deliveryStatus', row.deliveryStatus === 'delivered' ? 'undelivered' : 'delivered')}
                            title="Click to toggle delivery status"
                          >
                            <StatusBadge status={row.deliveryStatus} />
                          </button>
                        ) : (
                          <StatusBadge status={row.deliveryStatus} />
                        )}
                      </td>
                      <td>
                        {row.gallonObj ? (
                          <button
                            className="badge-button"
                            onClick={() => quickToggle(row.gallonObj, 'paymentStatus', row.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                            title="Click to toggle payment status"
                          >
                            <StatusBadge status={row.paymentStatus} />
                          </button>
                        ) : (
                          <StatusBadge status={row.paymentStatus} />
                        )}
                      </td>
                      <td className="muted">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })()}
    </div>
  );
}

