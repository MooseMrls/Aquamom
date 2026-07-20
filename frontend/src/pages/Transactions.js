import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import './Transactions.css';

const ACTION_LABELS = {
  registered: 'Registered',
  returned: 'Returned for refilling',
  assigned: 'Assigned to customer',
  delivered: 'Marked delivered',
  marked_undelivered: 'Marked undelivered',
  paid: 'Marked paid',
  marked_unpaid: 'Marked unpaid',
};

const ACTION_CLASSES = {
  registered: 'badge-registered',
  returned: 'badge-returned',
  assigned: 'badge-assigned',
  delivered: 'badge-delivered',
  marked_undelivered: 'badge-undelivered',
  paid: 'badge-paid',
  marked_unpaid: 'badge-unpaid',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 20;

  const loadTransactions = (pageNum = 1) => {
    setLoading(true);
    const params = {
      page: pageNum,
      limit,
    };
    if (search.trim()) params.search = search.trim();
    if (action) params.action = action;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    api
      .get('/transactions', { params })
      .then((res) => {
        setTransactions(res.data.transactions);
        setTotalCount(res.data.total);
        setTotalPages(res.data.pages);
        setPage(res.data.currentPage);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load transactions.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions(1);
  };

  const resetFilters = () => {
    setSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Directly fetch with clean params
    setLoading(true);
    api
      .get('/transactions', { params: { page: 1, limit } })
      .then((res) => {
        setTransactions(res.data.transactions);
        setTotalCount(res.data.total);
        setTotalPages(res.data.pages);
        setPage(res.data.currentPage);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load transactions.')))
      .finally(() => setLoading(false));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transactions Log</h1>
          <p className="page-subtitle">View and filter historical day-to-day gallon updates and activity.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-card panel">
        <form onSubmit={handleSearchSubmit} className="search-row">
          <input
            className="input"
            type="text"
            placeholder="Search by customer name or QR code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-outline">Search</button>
        </form>

        <div className="filters-grid">
          <label>
            Action Type
            <select
              className="input"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            Start Date
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <div className="filter-actions-cell">
            <button type="button" className="btn btn-text" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="panel list-panel">
        <div className="panel-header">
          <h2>Recorded Logs ({totalCount} total)</h2>
        </div>

        {loading && transactions.length === 0 ? (
          <p className="loading-state">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="empty-state">No transaction logs match the criteria.</p>
        ) : (
          <>
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
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="mono">{t.gallon?.qrCode || '-'}</td>
                    <td>{t.customer?.name || 'Unassigned'}</td>
                    <td>
                      <span className={`transaction-badge ${ACTION_CLASSES[t.action] || ''}`}>
                        {ACTION_LABELS[t.action] || t.action}
                      </span>
                    </td>
                    <td className="muted">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn btn-outline"
                  disabled={page <= 1 || loading}
                  onClick={() => loadTransactions(page - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadTransactions(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
