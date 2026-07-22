import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/customers')
      .then((res) => setCustomers(res.data))
      .catch((err) => setError(errorMessage(err, 'Failed to load customers.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submitAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/customers', form);
      setShowAdd(false);
      setForm({ name: '', address: '' });
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to add customer.'));
    } finally {
      setSaving(false);
    }
  };

  const quickToggleCustomerPayment = async (customer) => {
    try {
      // Find unpaid gallons belonging to this customer and mark them paid
      const customerGallons = await api.get(`/customers/${customer._id}`);
      const unpaidGallons = customerGallons.data.gallons.filter((g) => g.paymentStatus === 'unpaid');
      for (const g of unpaidGallons) {
        await api.patch(`/gallons/${g._id}`, { paymentStatus: 'paid' });
      }
      load();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update payment status.'));
    }
  };

  const visible = customers.filter((c) => {
    if (onlyUnpaid && c.unpaidBalance <= 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return c.name?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.unpaidBalance, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="page-subtitle">Track customer gallon activity and outstanding balances.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          Add Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="highlight-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div className="highlight-label">Total Outstanding Across All Customers</div>
          <div className="highlight-value">PHP {totalOutstanding.toLocaleString()}</div>
        </div>
        <label className="checkbox-inline">
          <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
          Show only customers with unpaid balance
        </label>
      </div>

      <div className="filter-bar" style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          className="input"
          type="text"
          placeholder="Search customer by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
        {search && (
          <button className="btn btn-text" onClick={() => setSearch('')}>
            Clear Search
          </button>
        )}
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Customer Records ({customers.length} total)
          </h2>
        </div>
        {loading ? (
          <div className="loading-block">Loading customers...</div>
        ) : visible.length === 0 ? (
          <p className="empty-state">No customers to display.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Total Gallons</th>
                <th>Undelivered</th>
                <th>Unpaid</th>
                <th>Unpaid Balance</th>
                <th>Quick Action</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.totalGallons}</td>
                  <td>{c.undeliveredCount}</td>
                  <td>{c.unpaidCount}</td>
                  <td className={c.unpaidBalance > 0 ? 'text-danger' : ''}>
                    PHP {c.unpaidBalance.toLocaleString()}
                  </td>
                  <td>
                    {c.unpaidBalance > 0 ? (
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => quickToggleCustomerPayment(c)}
                      >
                        Mark All Paid
                      </button>
                    ) : (
                      <span className="muted" style={{ fontSize: '12px' }}>Paid</span>
                    )}
                  </td>
                  <td>
                    <Link className="link-button" to={`/admin/customers/${c._id}`}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <form onSubmit={submitAdd} className="form">
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>
              Full Name
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Address
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Customer'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
