import { useEffect, useState, useCallback } from 'react';
import api, { errorMessage } from '../api.js';
import QrScanner from '../components/QrScanner.js';
import StatusBadge from '../components/StatusBadge.js';
import Modal from '../components/Modal.js';
import './Scanner.css';

export default function Scanner() {
  const [result, setResult] = useState(null);
  const [notFoundCode, setNotFoundCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [quickForm, setQuickForm] = useState({ customer: '', price: 25, size: 'Round' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  const submitScan = useCallback((code) => {
    setBusy(true);
    setError('');
    setMessage('');
    setNotFoundCode('');
    setResult(null);
    api
      .post('/gallons/scan', { qrCode: code })
      .then((res) => {
        setResult(res.data.gallon);
        setMessage(res.data.message);
        setShowModal(true);
      })
      .catch((err) => {
        if (err?.response?.status === 404 && err.response.data?.notFound) {
          setResult(null);
          setNotFoundCode(err.response.data.qrCode);
          setShowModal(true);
        } else {
          setError(errorMessage(err, 'Failed to process scan.'));
        }
      })
      .finally(() => setBusy(false));
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    submitScan(manualCode.trim());
    setManualCode('');
  };

  const registerNotFound = async () => {
    setBusy(true);
    try {
      await api.post('/gallons', {
        qrCode: notFoundCode,
        customer: quickForm.customer || null,
        price: Number(quickForm.price),
        size: quickForm.size,
      });
      setMessage(`Gallon ${notFoundCode} registered and added to the station.`);
      setNotFoundCode('');
      setShowModal(false);
    } catch (err) {
      setError(errorMessage(err, 'Failed to register gallon.'));
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setResult(null);
    setNotFoundCode('');
    setMessage('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Scan Gallon</h1>
          <p className="page-subtitle">Scan a returned gallon to receive it into the station for refilling.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="panel">
          <h2>Camera</h2>
          <QrScanner onResult={submitScan} onError={setCameraError} paused={busy || showModal} />
          {cameraError && (
            <div className="alert alert-error camera-error-alert">
              {cameraError}. You can still use manual entry below.
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="manual-entry">
            <input
              className="input"
              placeholder="Or type the QR code manually"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Submit
            </button>
          </form>
        </div>
      </div>

      {showModal && (
        <Modal title="Scan Result" onClose={closeModal}>
          {message && <div className="alert alert-success">{message}</div>}

          {notFoundCode && (
            <div className="result-card">
              <p>
                QR code <strong className="mono">{notFoundCode}</strong> is not registered yet.
              </p>
              <div className="form-row">
                <label>
                  Assign to Customer (optional)
                  <select
                    className="input"
                    value={quickForm.customer}
                    onChange={(e) => setQuickForm({ ...quickForm, customer: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (PHP)
                  <input
                    className="input"
                    type="number"
                    value={quickForm.price}
                    onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                  />
                </label>
              </div>
              <button className="btn btn-primary" onClick={registerNotFound} disabled={busy} style={{ width: '100%', marginTop: '12px' }}>
                Register This Gallon
              </button>
            </div>
          )}

          {result && (
            <div className="result-card" style={{ padding: '8px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p className="mono result-code" style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0' }}>
                  {result.qrCode}
                </p>
                <div className="result-badges" style={{ justifyContent: 'center', display: 'flex', gap: '8px' }}>
                  <StatusBadge status={result.locationStatus} />
                  <StatusBadge status={result.deliveryStatus} />
                  <StatusBadge status={result.paymentStatus} />
                </div>
              </div>

              <div style={{ background: 'var(--surface-alt)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span className="muted" style={{ fontSize: '12px' }}>Customer: </span>
                  <strong>{result.customer?.name || 'Unassigned'}</strong>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: '12px' }}>Size / Price: </span>
                  <strong>{result.size} (PHP {result.price})</strong>
                </div>
              </div>

              <button className="btn btn-primary" onClick={closeModal} style={{ width: '100%', marginTop: '20px' }}>
                Done
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
