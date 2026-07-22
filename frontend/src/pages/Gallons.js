import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';
import Modal from '../components/Modal.js';
import './Gallons.css';

const emptyForm = { qrCode: '', customer: '', size: 'Round', price: 25 };

export default function Gallons() {
  const [gallons, setGallons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ search: '', locationStatus: '', deliveryStatus: '', paymentStatus: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [customSize, setCustomSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [editGallon, setEditGallon] = useState(null);
  const [editSizeSelection, setEditSizeSelection] = useState('Round');
  const [editCustomSize, setEditCustomSize] = useState('');
  const [qrGallon, setQrGallon] = useState(null);
  const [qrImage, setQrImage] = useState('');

  const loadGallons = () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    api
      .get('/gallons', { params })
      .then((res) => setGallons(res.data))
      .catch((err) => setError(errorMessage(err, 'Failed to load gallons.')))
      .finally(() => setLoading(false));
  };

  const loadCustomers = () => {
    api
      .get('/customers')
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadGallons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openRegister = () => {
    setForm(emptyForm);
    setCustomSize('');
    setFormError('');
    setShowRegister(true);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/gallons', {
        qrCode: form.qrCode,
        customer: form.customer || null,
        size: form.size === 'Custom' ? customSize : form.size,
        price: Number(form.price),
      });
      setShowRegister(false);
      setNotice('Gallon registered successfully.');
      loadGallons();
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to register gallon.'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (gallon) => {
    const isStandard = ['Round', 'Slim'].includes(gallon.size);
    setEditGallon({
      ...gallon,
      customer: gallon.customer?._id || '',
    });
    setEditSizeSelection(isStandard ? gallon.size : 'Custom');
    setEditCustomSize(isStandard ? '' : gallon.size);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/gallons/${editGallon._id}`, {
        customer: editGallon.customer || null,
        size: editSizeSelection === 'Custom' ? editCustomSize : editSizeSelection,
        price: Number(editGallon.price),
        deliveryStatus: editGallon.deliveryStatus,
        paymentStatus: editGallon.paymentStatus,
        notes: editGallon.notes,
      });
      setEditGallon(null);
      setNotice('Gallon updated successfully.');
      loadGallons();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (gallon, field, value) => {
    try {
      await api.patch(`/gallons/${gallon._id}`, { [field]: value });
      loadGallons();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  const removeGallon = async (gallon) => {
    if (!window.confirm(`Remove gallon ${gallon.qrCode} from the system?`)) return;
    try {
      await api.delete(`/gallons/${gallon._id}`);
      setNotice('Gallon removed.');
      loadGallons();
    } catch (err) {
      setError(errorMessage(err, 'Failed to remove gallon.'));
    }
  };

  const viewQr = async (gallon) => {
    setQrGallon(gallon);
    setQrImage('');
    try {
      const res = await api.get(`/gallons/${gallon._id}/qr`);
      setQrImage(res.data.image);
    } catch (err) {
      setError(errorMessage(err, 'Failed to generate QR image.'));
    }
  };

  const printQr = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Aquamom Gallon Label - ${qrGallon.qrCode}</title></head>
        <body style="text-align:center; font-family: Arial, sans-serif; padding: 40px;">
          <h2 style="margin-bottom:4px;">Aquamom</h2>
          <p style="margin-top:0; color:#555;">Water Refilling Station</p>
          <img src="${qrImage}" style="width:280px;height:280px;" />
          <p style="font-size:18px; letter-spacing:1px;">${qrGallon.qrCode}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gallon Records</h1>
          <p className="page-subtitle">Register, track, and update every gallon in circulation.</p>
        </div>
        <button className="btn btn-primary" onClick={openRegister}>
          Register New Gallon
        </button>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search by customer name or QR code..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="input"
          value={filters.locationStatus}
          onChange={(e) => setFilters({ ...filters, locationStatus: e.target.value })}
        >
          <option value="">All Locations</option>
          <option value="at_station">At Station</option>
          <option value="with_customer">With Customer</option>
        </select>
        <select
          className="input"
          value={filters.deliveryStatus}
          onChange={(e) => setFilters({ ...filters, deliveryStatus: e.target.value })}
        >
          <option value="">All Delivery Statuses</option>
          <option value="delivered">Delivered</option>
          <option value="undelivered">Undelivered</option>
        </select>
        <select
          className="input"
          value={filters.paymentStatus}
          onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Tracked Gallons ({gallons.length} total)
          </h2>
        </div>
        {loading ? (
          <div className="loading-block">Loading gallons...</div>
        ) : gallons.length === 0 ? (
          <p className="empty-state">No gallons match the current filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>QR Code</th>
                <th>Customer</th>
                <th>Size</th>
                <th>Price</th>
                <th>Location</th>
                <th>Delivery</th>
                <th>Payment</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gallons.map((g) => (
                <tr key={g._id}>
                  <td className="mono">{g.qrCode}</td>
                  <td>{g.customer?.name || <span className="muted">Unassigned</span>}</td>
                  <td>{g.size}</td>
                  <td>PHP {g.price}</td>
                  <td><StatusBadge status={g.locationStatus} /></td>
                  <td><StatusBadge status={g.deliveryStatus} /></td>
                  <td><StatusBadge status={g.paymentStatus} /></td>
                  <td className="muted">{new Date(g.updatedAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="link-button" onClick={() => viewQr(g)}>QR</button>
                    <button className="link-button" onClick={() => openEdit(g)}>Edit</button>
                    <button className="link-button link-danger" onClick={() => removeGallon(g)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRegister && (
        <Modal title="Register New Gallon" onClose={() => setShowRegister(false)}>
          <form onSubmit={submitRegister} className="form">
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>
              QR Code (leave blank to auto-generate)
              <input
                className="input"
                value={form.qrCode}
                onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                placeholder="AQM-XXXXXXXX"
              />
            </label>
            <label>
              Assign to Customer (optional)
              <select className="input" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
                <option value="">Unassigned</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Size
                <select className="input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  <option value="Round">Round</option>
                  <option value="Slim">Slim</option>
                  <option value="Custom">Custom...</option>
                </select>
              </label>
              {form.size === 'Custom' && (
                <label>
                  Custom Size Name
                  <input
                    className="input"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="e.g. 5 Liters"
                    required
                  />
                </label>
              )}
              <label>
                Price (PHP)
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Register Gallon'}
            </button>
          </form>
        </Modal>
      )}

      {editGallon && (
        <Modal title={`Edit Gallon ${editGallon.qrCode}`} onClose={() => setEditGallon(null)}>
          <form onSubmit={submitEdit} className="form">
            <label>
              Assigned Customer
              <select
                className="input"
                value={editGallon.customer}
                onChange={(e) => setEditGallon({ ...editGallon, customer: e.target.value })}
              >
                <option value="">Unassigned</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Size
                <select className="input" value={editSizeSelection} onChange={(e) => setEditSizeSelection(e.target.value)}>
                  <option value="Round">Round</option>
                  <option value="Slim">Slim</option>
                  <option value="Custom">Custom...</option>
                </select>
              </label>
              {editSizeSelection === 'Custom' && (
                <label>
                  Custom Size Name
                  <input
                    className="input"
                    value={editCustomSize}
                    onChange={(e) => setEditCustomSize(e.target.value)}
                    placeholder="e.g. 5 Liters"
                    required
                  />
                </label>
              )}
              <label>
                Price (PHP)
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={editGallon.price}
                  onChange={(e) => setEditGallon({ ...editGallon, price: e.target.value })}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                className="input"
                rows="2"
                value={editGallon.notes || ''}
                onChange={(e) => setEditGallon({ ...editGallon, notes: e.target.value })}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {qrGallon && (
        <Modal title={`QR Label - ${qrGallon.qrCode}`} onClose={() => setQrGallon(null)} width="360px">
          <div className="qr-preview">
            {qrImage ? <img src={qrImage} alt={qrGallon.qrCode} width="240" height="240" /> : <p>Generating...</p>}
            <p className="mono qr-code-text">{qrGallon.qrCode}</p>
            <button className="btn btn-outline" onClick={printQr} disabled={!qrImage}>
              Print Label
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
