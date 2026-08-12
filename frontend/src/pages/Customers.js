import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.js';
import './Customers.css';

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
          <h1>Customer Directory</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Outstanding Balance Banner */}
      <div className="customers-balance-banner">
        <div>
          <div className="customers-balance-label">Total Outstanding Balance</div>
          <div className="customers-balance-value">₱{totalOutstanding.toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{customers.length} total customers</span>
          <label className="customers-toggle">
            <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
            <span>Unpaid only</span>
          </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="customers-search-bar">
        <svg style={{ width: '16px', height: '16px', color: 'var(--muted)', flexShrink: 0 }} viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <input
          className="input"
          type="text"
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', boxShadow: 'none', paddingLeft: 0 }}
        />
        {search && (
          <button className="btn btn-text btn-sm" onClick={() => setSearch('')}>Clear</button>
        )}
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="loading-block">Loading customers...</div>
      ) : visible.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px' }}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--muted)', marginBottom: '16px' }} viewBox="0 0 20 20" fill="none"><circle cx="7.2" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.8 16c.4-2.8 2.2-4.5 4.4-4.5s4 1.7 4.4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M13 11.7c1.8.2 3.1 1.7 3.4 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <h3>No Customers Found</h3>
          <p className="muted">No customers match the current search or filter criteria.</p>
        </div>
      ) : (
        <div className="panel list-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Gallons</th>
                <th>Undelivered</th>
                <th>Unpaid Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span style={{ fontWeight: '600' }}>{c.name}</span>
                  </td>
                  <td>{c.totalGallons}</td>
                  <td>{c.undeliveredCount > 0 ? <span className="text-danger">{c.undeliveredCount}</span> : '0'}</td>
                  <td>
                    <span className={c.unpaidBalance > 0 ? 'text-danger' : ''} style={{ fontWeight: '700' }}>
                      ₱{c.unpaidBalance.toLocaleString()}
                    </span>
                    {c.unpaidBalance > 0 && (
                      <button className="btn btn-outline btn-sm" style={{ marginLeft: '8px' }} onClick={() => quickToggleCustomerPayment(c)}>
                        Mark Paid
                      </button>
                    )}
                  </td>
                  <td>
                    <Link className="link-button" to={`/admin/customers/${c._id}`}>
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <form onSubmit={submitAdd} className="form">
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>
              Full Name
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter customer's full name" />
            </label>
            <label>
              Address
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Enter customer's address (optional)" />
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