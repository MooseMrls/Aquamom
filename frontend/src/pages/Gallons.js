import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import StatusBadge from '../components/StatusBadge.js';
import Modal from '../components/Modal.js';
import Pagination from '../components/Pagination.js';
import './Gallons.css';

const emptyForm = { qrCode: '', customer: '', size: 'Round', price: 30 };
const PAGE_SIZE = 20;

export default function Gallons() {
  const [gallons, setGallons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ search: '', locationStatus: '', deliveryStatus: '', paymentStatus: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
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
    const params = { page, limit: PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    api
      .get('/gallons', { params })
      .then((res) => {
        setGallons(res.data.gallons);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load gallons.')))
      .finally(() => setLoading(false));
  };

  const loadCustomers = () => {
    api
      .get('/customers', { params: { limit: 1000 } })
      .then((res) => setCustomers(res.data.customers))
      .catch(() => {});
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Jump back to page 1 whenever the filters change, so a narrowed search
  // never leaves the user stranded on a page past the end of the results.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadGallons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

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
      <div className="page-header page-header-actions">
        <div>
          <h1>Gallon Inventory</h1>
        </div>
        <button className="btn btn-primary" onClick={openRegister}>
          + New Gallon
        </button>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter Controls */}
      <div className="gallon-filters">
        <div className="gallon-filter-search">
          <svg style={{ width: '16px', height: '16px', color: 'var(--muted)', flexShrink: 0 }} viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input
            className="input"
            placeholder="Search by customer name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ border: 'none', boxShadow: 'none', paddingLeft: '0' }}
          />
        </div>
        <select className="input" value={filters.locationStatus} onChange={(e) => setFilters({ ...filters, locationStatus: e.target.value })} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Locations</option>
          <option value="at_station">At Station</option>
          <option value="with_customer">With Customer</option>
        </select>
        <select className="input" value={filters.deliveryStatus} onChange={(e) => setFilters({ ...filters, deliveryStatus: e.target.value })} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="undelivered">Undelivered</option>
        </select>
        <select className="input" value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Results Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: '600' }}>
          {total} gallon{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {loading ? (
        <div className="loading-block">Loading gallon inventory...</div>
      ) : gallons.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px' }}>
          <svg style={{ width: '48px', height: '48px', color: 'var(--muted)', marginBottom: '16px' }} viewBox="0 0 20 20" fill="none"><path d="M7 2.5h6l.6 2.8a5.6 5.6 0 0 1 2.4 4.6c0 3.6-2.7 6.6-6 6.6s-6-3-6-6.6a5.6 5.6 0 0 1 2.4-4.6L7 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          <h3 style={{ marginBottom: '6px' }}>No Gallons Found</h3>
          <p className="muted">No gallons match the current filters. Register a new gallon or adjust your search.</p>
        </div>
      ) : (
        <div className="panel list-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Size</th>
                <th>Price</th>
                <th>Delivery</th>
                <th>Payment</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gallons.map((g) => (
                <tr key={g._id}>
                  <td style={{ fontWeight: '600' }}>{g.customer?.name || <span className="muted">Unassigned</span>}</td>
                  <td>{g.size}</td>
                  <td>₱{g.price}</td>
                  <td><StatusBadge status={g.deliveryStatus} /></td>
                  <td><StatusBadge status={g.paymentStatus} /></td>
                  <td className="muted">{new Date(g.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon btn-icon-delivery" data-tooltip={g.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'} title={g.deliveryStatus === 'delivered' ? 'Mark Undelivered' : 'Mark Delivered'} onClick={() => quickToggle(g, 'deliveryStatus', g.deliveryStatus === 'delivered' ? 'undelivered' : 'delivered')}>
                        {g.deliveryStatus === 'delivered' ? (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M5 15L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 10.5l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                      <button className="btn-icon btn-icon-payment" data-tooltip={g.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'} title={g.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'} onClick={() => quickToggle(g, 'paymentStatus', g.paymentStatus === 'paid' ? 'unpaid' : 'paid')}>
                        {g.paymentStatus === 'paid' ? (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8M15 5L5 15"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14M8 3h4.5a3.5 3.5 0 0 1 0 7H8M5 6.5h8M5 8.5h8"/></svg>
                        )}
                      </button>
                      <button className="btn-icon btn-icon-qr" data-tooltip="View QR" title="View QR" onClick={() => viewQr(g)}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="13" width="2" height="2" fill="currentColor"/><rect x="13" y="17" width="4" height="0" stroke="currentColor" strokeWidth="1.5"/><path d="M11 13h2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <button className="btn-icon btn-icon-edit" data-tooltip="Edit" title="Edit" onClick={() => openEdit(g)}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="btn-icon btn-icon-danger" data-tooltip="Remove" title="Remove" onClick={() => removeGallon(g)}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 7h10l-1 10H6L5 7zM8 4h4M3 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <Modal title="Register New Gallon" onClose={() => setShowRegister(false)}>
          <form onSubmit={submitRegister} className="form">
            {formError && <div className="alert alert-error">{formError}</div>}
            <label>
              Assign to Customer (optional)
              <select className="input" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
                <option value="">Unassigned</option>
                {customers.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
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
                  <input className="input" value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="e.g. 5 Liters" required />
                </label>
              )}
              <label>
                Price (PHP)
                <input className="input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Register Gallon'}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editGallon && (
        <Modal title={`Edit Gallon ${editGallon.qrCode}`} onClose={() => setEditGallon(null)}>
          <form onSubmit={submitEdit} className="form">
            <label>
              Assigned Customer
              <select className="input" value={editGallon.customer} onChange={(e) => setEditGallon({ ...editGallon, customer: e.target.value })}>
                <option value="">Unassigned</option>
                {customers.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
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
                  <input className="input" value={editCustomSize} onChange={(e) => setEditCustomSize(e.target.value)} placeholder="e.g. 5 Liters" required />
                </label>
              )}
              <label>
                Price (PHP)
                <input className="input" type="number" min="0" value={editGallon.price} onChange={(e) => setEditGallon({ ...editGallon, price: e.target.value })} />
              </label>
            </div>
            <label>
              Notes
              <textarea className="input" rows="2" value={editGallon.notes || ''} onChange={(e) => setEditGallon({ ...editGallon, notes: e.target.value })} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* QR Preview Modal */}
      {qrGallon && (
        <Modal title={`QR Label — ${qrGallon.qrCode}`} onClose={() => setQrGallon(null)} width="360px">
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