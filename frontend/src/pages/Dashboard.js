import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import StatCard from '../components/StatCard.js';
import StatusBadge from '../components/StatusBadge.js';
import './Today.css';

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
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Dashboard</h1>
        </div>
        {/* <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/scanner" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Scan Camera
          </Link>
          <Link to="/admin/walkin" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Walk-in Sales
          </Link>
        </div> */}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && !stats && !todayData && <div className="loading-block">Loading dashboard metrics...</div>}

      {todayData && (
        <div className="today-stats-grid" style={{ marginBottom: '24px' }}>
          <StatCard
            label="Total Refills Today"
            value={todayData.totalRefillsIncludingWalkIn}
            hint={`${todayData.refillsCount} registered, ${todayData.walkInGallonsCount} walk-in`}
            tone="blue"
          />
          <StatCard
            label="Delivered Gallons"
            value={todayData.deliveriesCount}
            hint="Delivered to customer sites"
          />
          <StatCard
            label="Transactions Paid"
            value={todayData.paidCount}
            hint="Fully collected today"
            tone="good"
          />
          <StatCard
            label="Daily Revenue"
            value={`₱${todayData.totalRevenue.toLocaleString()}`}
            hint="Combined walk-in & refills"
            tone="good"
          />
        </div>
      )}

      <div className="dashboard-split-layout">
        {/* Left Side: Activity Timeline Feed */}
        <div>
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
                customerName: g.customer?.name || 'Unassigned Customer',
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
                customerName: 'Walk-in Cash Customer',
                size: w.walkInDetails?.size || '-',
                price: w.walkInDetails?.totalAmount || 0,
                locationStatus: 'at_station',
                deliveryStatus: 'delivered',
                paymentStatus: 'paid',
                latestAction: 'walkin_sale',
                time: w.createdAt,
                note: w.note || `Walk-in cash refill (${w.walkInDetails?.quantity} pcs)`,
                gallonObj: null,
              })),
            ].sort((a, b) => new Date(b.time) - new Date(a.time));

            return (
              <section className="panel" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-600)' }} />
                  Today's Activity ({displayRows.length})
                </h2>
                {displayRows.length === 0 ? (
                  <p className="empty-state">No transaction logs recorded at the station today yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {displayRows.map((row) => (
                      <div key={row.id} style={{ display: 'flex', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', width: '68px', paddingTop: '2px', fontWeight: '500' }}>
                          {new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.95rem' }}>{row.customerName}</strong>
                              <StatusBadge status={row.deliveryStatus} />
                              <StatusBadge status={row.paymentStatus} />
                            </div>
                            {row.gallonObj && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="btn-icon btn-icon-delivery"
                                    data-tooltip={row.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'}
                                    title={row.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'}
                                    onClick={() => quickToggle(row.gallonObj, 'deliveryStatus', row.deliveryStatus === 'delivered' ? 'undelivered' : 'delivered')}
                                  >
                                    {row.deliveryStatus === 'delivered' ? (
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 10.5l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    )}
                                  </button>
                                  <button
                                    className="btn-icon btn-icon-payment"
                                    data-tooltip={row.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                    title={row.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                    onClick={() => quickToggle(row.gallonObj, 'paymentStatus', row.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                                  >
                                    {row.paymentStatus === 'paid' ? (
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8M15 5L5 15"/></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8"/></svg>
                                    )}
                                  </button>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                            <span className="mono" style={{ padding: '2px 6px', background: 'var(--surface-alt)', borderRadius: '4px' }}>
                              QR: {row.qrCode}
                            </span>
                            <span>&bull;</span>
                            <span>{row.size}</span>
                            <span>&bull;</span>
                            <span style={{ fontWeight: '600' }}>₱{row.price}</span>
                          </div>
                          {row.note && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>Note: {row.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })()}
        </div>

        {/* Right Side: Unpaid summary & shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {stats && (
            <div className="panel" style={{ background: 'var(--gradient-panel)', color: '#ffffff', border: 'none', padding: '24px' }}>
              <div className="highlight-label" style={{ color: 'rgba(255,255,255,0.7)' }}> Unpaid Balance</div>
              <div className="highlight-value" style={{ fontSize: '2rem', marginTop: '6px', color: '#ffffff', letterSpacing: '-0.02em', fontWeight: '800' }}>
                ₱{stats.unpaidBalance.toLocaleString()}
              </div>
              <Link to="/admin/customers" className="btn btn-outline" style={{ marginTop: '16px', width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', background: 'rgba(255,255,255,0.08)' }}>
                View Unpaid Customers &rarr;
              </Link>
            </div>
          )}

          {/* <div className="panel" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '1rem', fontWeight: '700' }}>Station Utilities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/admin/gallons" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.9rem', fontWeight: '600' }}>
                <span>Gallon Inventory</span>
                <span>&rarr;</span>
              </Link>
              <Link to="/admin/customers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.9rem', fontWeight: '600' }}>
                <span>Manage Customers</span>
                <span>&rarr;</span>
              </Link>
              <Link to="/admin/transactions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.9rem', fontWeight: '600' }}>
                <span>View Transaction Logs</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
