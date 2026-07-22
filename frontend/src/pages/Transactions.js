import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';
import './Transactions.css';

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
      price: g.price ?? 25,
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
    const key = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
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
  const [filterType, setFilterType] = useState('week'); // 'week' | 'month' | 'date'
  const [selectedWeek, setSelectedWeek] = useState(''); // e.g. "2026-W30"
  const [selectedMonth, setSelectedMonth] = useState(''); // e.g. "2026-07"
  const [selectedDate, setSelectedDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Track collapsed day section
  const [collapsedDays, setCollapsedDays] = useState({});

  const formatDate = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

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

  // Helper to format current week as YYYY-Wxx (HTML week input format)
  const getCurrentWeekString = () => {
    const today = new Date();
    const target = new Date(today.valueOf());
    const dayNr = (today.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
    const year = target.getFullYear();
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // Helper to calculate start and end dates for a YYYY-Wxx week input value
  const getWeekRange = (weekStr) => {
    if (!weekStr) return { startDate: '', endDate: '' };
    const [yearStr, weekNumStr] = weekStr.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekNumStr, 10);

    // Simple ISO week start calculation
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

    return { startDate: formatDate(ISOweekStart), endDate: formatDate(ISOweekEnd) };
  };

  const loadTransactions = () => {
    let startDate = '';
    let endDate = '';

    if (filterType === 'week') {
      const activeWeek = selectedWeek || getCurrentWeekString();
      const range = getWeekRange(activeWeek);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (filterType === 'month') {
      const activeMonth = selectedMonth || getCurrentMonthString();
      const range = getMonthRange(activeMonth);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (filterType === 'date') {
      if (!selectedDate) return;
      startDate = selectedDate;
      endDate = selectedDate;
    }

    if (!startDate || !endDate) return;

    setLoading(true);
    setError('');

    const params = {
      startDate,
      endDate,
      limit: 500,
    };

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

  // Set default week & month strings on mount if not set
  useEffect(() => {
    if (!selectedWeek) setSelectedWeek(getCurrentWeekString());
    if (!selectedMonth) setSelectedMonth(getCurrentMonthString());
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedWeek, selectedMonth, selectedDate]);

  const toggleDay = (dateKey) => {
    setCollapsedDays((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const dayGroups = groupByDay(transactions);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transactions Log</h1>
          <p className="page-subtitle">Filter historical records per week, per month, or per specific date.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-card panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={`btn ${filterType === 'week' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterType('week')}
            >
              Per Week
            </button>
            <button
              type="button"
              className={`btn ${filterType === 'month' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterType('month')}
            >
              Per Month
            </button>
            <button
              type="button"
              className={`btn ${filterType === 'date' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterType('date')}
            >
              Per Date
            </button>
          </div>

          {filterType === 'week' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
                Select Week:
              </label>
              <input
                className="input"
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{ width: '210px' }}
              />
            </div>
          ) : filterType === 'month' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
                Select Month:
              </label>
              <input
                className="input"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ width: '190px' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
                Select Date:
              </label>
              <input
                className="input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '190px' }}
              />
            </div>
          )}
        </div>
      </div>

      {filterType === 'date' && !selectedDate ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>No Date Selected</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Please select a date above to view transaction records for that day.
          </p>
        </div>
      ) : loading ? (
        <p className="loading-state">Loading transaction records...</p>
      ) : transactions.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="empty-state">No transaction records found for the selected {filterType}.</p>
        </div>
      ) : (
        <>
          {dayGroups.map((group) => (
            <div key={group.dateKey} className="day-group">
              <button
                className="day-group-header"
                onClick={() => toggleDay(group.dateKey)}
              >
                <div className="day-group-title">
                  <span className={`day-group-chevron ${collapsedDays[group.dateKey] ? 'collapsed' : ''}`}>▼</span>
                  <span>{group.label}</span>
                </div>
                <div className="day-group-meta">
                  {group.dayUndeliveredCount > 0 && (
                    <span className="day-group-pill pill-undelivered">
                      Undelivered: {group.dayUndeliveredCount}
                    </span>
                  )}
                  {group.dayUnpaidCount > 0 && (
                    <span className="day-group-pill pill-unpaid">
                      Unpaid: {group.dayUnpaidCount}
                    </span>
                  )}
                  <span className="day-group-revenue">Revenue: PHP {group.dayTotalRevenue.toLocaleString()}</span>
                  <span className="day-group-count">{group.displayRows.length} active gallons & sales</span>
                </div>
              </button>

              {!collapsedDays[group.dateKey] && (
                <div className="day-group-body">
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
                      {group.displayRows.map((row) => (
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
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
