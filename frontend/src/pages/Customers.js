import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import Modal from '../components/Modal.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
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
      setForm({ name: '', phone: '', address: '' });
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to add customer.'));
    } finally {
      setSaving(false);
    }
  };

  const visible = onlyUnpaid ? customers.filter((c) => c.unpaidBalance > 0) : customers;
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

      <div className="highlight-banner">
        <div>
          <div className="highlight-label">Total Outstanding Across All Customers</div>
          <div className="highlight-value">PHP {totalOutstanding.toLocaleString()}</div>
        </div>
        <label className="checkbox-inline">
          <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} />
          Show only customers with unpaid balance
        </label>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-block">Loading customers...</div>
        ) : visible.length === 0 ? (
          <p className="empty-state">No customers to display.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Total Gallons</th>
                <th>Undelivered</th>
                <th>Unpaid</th>
                <th>Unpaid Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="muted">{c.phone || '-'}</td>
                  <td>{c.totalGallons}</td>
                  <td>{c.undeliveredCount}</td>
                  <td>{c.unpaidCount}</td>
                  <td className={c.unpaidBalance > 0 ? 'text-danger' : ''}>
                    PHP {c.unpaidBalance.toLocaleString()}
                  </td>
                  <td>
                    <Link className="link-button" to={`/admin/customers/${c._id}`}>
                      View
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
              Phone Number
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
