import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';
import './Transactions.css';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function processDayTransactions(transactions) {
  const uniqueGallonsMap = {};
  const walkIns = [];

  transactions.forEach((t) => {
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

  return [
    ...Object.values(uniqueGallonsMap).map((g) => ({
      id: g._id,
      isWalkIn: false,
      qrCode: g.qrCode,
      customerName: g.customer?.name || 'Unassigned',
      size: g.size,
      price: g.price ?? 30,
      deliveryStatus: g.deliveryStatus,
      paymentStatus: g.paymentStatus,
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
      deliveryStatus: 'delivered',
      paymentStatus: 'paid',
      time: w.createdAt,
      note: w.note || `Walk-in Sale (${w.walkInDetails?.quantity} pcs)`,
      gallonObj: null,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));
}

function groupByDay(transactions) {
  const groups = {};
  transactions.forEach((t) => {
    const date = new Date(t.createdAt);
    const key = date.toLocaleDateString('en-CA');
    if (!groups[key]) {
      groups[key] = {
        dateKey: key,
        label: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        rawTransactions: [],
      };
    }
    groups[key].rawTransactions.push(t);
  });

  return Object.values(groups)
    .map((g) => {
      const displayRows = processDayTransactions(g.rawTransactions);
      const dayTotalRevenue = displayRows.reduce((sum, row) => {
        return row.paymentStatus === 'paid' ? sum + Number(row.price || 0) : sum;
      }, 0);
      const dayUndeliveredCount = displayRows.filter((r) => r.deliveryStatus === 'undelivered').length;
      const dayUnpaidCount = displayRows.filter((r) => r.paymentStatus === 'unpaid').length;

      return {
        ...g,
        displayRows,
        dayTotalRevenue,
        dayUndeliveredCount,
        dayUnpaidCount,
      };
    })
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export default function Transactions() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collapsedDays, setCollapsedDays] = useState({});

  const formatDate = (d) => d.toLocaleDateString('en-CA');

  const getCurrentMonthString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  const getMonthRange = (monthStr) => {
    if (!monthStr) return { startDate: '', endDate: '' };
    const [yearStr, monthNumStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthNumStr, 10);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    return { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
  };

  const loadTransactions = () => {
    const activeMonth = selectedMonth || getCurrentMonthString();
    const { startDate, endDate } = getMonthRange(activeMonth);

    if (!startDate || !endDate) return;

    setLoading(true);
    setError('');

    const params = { startDate, endDate, limit: 500 };

    api
      .get('/transactions', { params })
      .then((res) => {
        setTransactions(res.data.transactions);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load transactions.')))
      .finally(() => setLoading(false));
  };

  const quickToggle = async (gallon, field, value) => {
    if (!gallon) return;
    try {
      await api.patch(`/gallons/${gallon._id}`, { [field]: value });
      loadTransactions();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  useEffect(() => {
    if (!selectedMonth) setSelectedMonth(getCurrentMonthString());
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const toggleDay = (dateKey, defaultCollapsed) => {
    setCollapsedDays((prev) => {
      const current = prev[dateKey] !== undefined ? prev[dateKey] : defaultCollapsed;
      return { ...prev, [dateKey]: !current };
    });
  };

  const dayGroups = groupByDay(transactions);
  const grandTotalRevenue = dayGroups.reduce((sum, g) => sum + g.dayTotalRevenue, 0);

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Transactions Log</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter Controls Card */}
      <div className="filters-card panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span className="page-subtitle" style={{ marginTop: 0 }}>Viewing transactions for</span>
          <input
            className="input input-w-md"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Total Revenue Summary Banner */}
      {!loading && dayGroups.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: '600' }}>
            Total Period Collected Revenue
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--green-600)' }}>
            ₱{grandTotalRevenue.toLocaleString()}
          </span>
        </div>
      )}

      {/* Day Groups List */}
      {loading ? (
        <div className="loading-state">Loading transaction history...</div>
      ) : dayGroups.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px' }}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--muted)', marginBottom: '16px' }} viewBox="0 0 20 20" fill="none">
            <path d="M3 5.5h14M3 10h14M3 14.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15.5" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h3>No Transactions Found</h3>
          <p className="muted">No transactions were recorded during the selected period.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dayGroups.map((group, index) => {
            const defaultCollapsed = index > 0;
            const isCollapsed = collapsedDays[group.dateKey] !== undefined
              ? collapsedDays[group.dateKey]
              : defaultCollapsed;

            return (
              <div className="day-group" key={group.dateKey}>
                <button
                  type="button"
                  className="day-group-header"
                  onClick={() => toggleDay(group.dateKey, defaultCollapsed)}
                >
                  <div className="day-group-title">
                    <span className={`day-group-chevron ${isCollapsed ? 'collapsed' : ''}`}>
                      <ChevronIcon />
                    </span>
                    <span>{group.label}</span>
                  </div>

                  <div className="day-group-meta">
                    {group.dayUndeliveredCount > 0 && (
                      <span className="day-group-pill pill-undelivered">
                        {group.dayUndeliveredCount} Undelivered
                      </span>
                    )}
                    {group.dayUnpaidCount > 0 && (
                      <span className="day-group-pill pill-unpaid">
                        {group.dayUnpaidCount} Unpaid
                      </span>
                    )}
                    <span className="day-group-revenue">
                      ₱{group.dayTotalRevenue.toLocaleString()}
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="day-group-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {group.displayRows.map((row) => (
                        <div key={row.id} className="tx-card">
                          <div className="activity-time desktop-only-time">
                            {new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="activity-main">
                            <div className="activity-header">
                              <div className="activity-title-group">
                                <div className="activity-title-row">
                                  <strong className="activity-name">{row.customerName}</strong>
                                  <span className="mobile-only-time">
                                    &bull; {new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="activity-badges">
                                  <StatusBadge status={row.deliveryStatus} />
                                  <StatusBadge status={row.paymentStatus} />
                                </div>
                              </div>
                              {row.gallonObj && (
                                <div className="activity-actions">
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

                            <div className="activity-details">
                              {row.qrCode !== '-' && (
                                <span className="mono activity-qr-badge">
                                  AQM: {row.qrCode}
                                </span>
                              )}
                              <span>{row.size}</span>
                              <span className="activity-dot">&bull;</span>
                              <span className="activity-price">₱{row.price}</span>
                            </div>

                            {row.note && <div className="activity-note">Note: {row.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}