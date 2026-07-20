import { useEffect, useState, useCallback } from 'react';
import api, { errorMessage } from '../api.js';
import QrScanner from '../components/QrScanner.js';
import StatusBadge from '../components/StatusBadge.js';
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

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  const submitScan = useCallback((code) => {
    setBusy(true);
    setError('');
    setMessage('');
    setNotFoundCode('');
    api
      .post('/gallons/scan', { qrCode: code })
      .then((res) => {
        setResult(res.data.gallon);
        setMessage(res.data.message);
      })
      .catch((err) => {
        if (err?.response?.status === 404 && err.response.data?.notFound) {
          setResult(null);
          setNotFoundCode(err.response.data.qrCode);
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
    } catch (err) {
      setError(errorMessage(err, 'Failed to register gallon.'));
    } finally {
      setBusy(false);
    }
  };

  const markDelivered = async () => {
    if (!result) return;
    try {
      const res = await api.patch(`/gallons/${result._id}`, { deliveryStatus: 'delivered' });
      setResult(res.data);
      setMessage('Gallon marked as delivered.');
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  const markPaid = async () => {
    if (!result) return;
    try {
      const res = await api.patch(`/gallons/${result._id}`, { paymentStatus: 'paid' });
      setResult(res.data);
      setMessage('Payment recorded.');
    } catch (err) {
      setError(errorMessage(err, 'Failed to update gallon.'));
    }
  };

  const assignCustomer = async (customerId) => {
    if (!result) return;
    try {
      const res = await api.patch(`/gallons/${result._id}`, { customer: customerId || null });
      setResult(res.data);
      setMessage('Customer assignment updated.');
    } catch (err) {
      setError(errorMessage(err, 'Failed to assign customer.'));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Scan Gallon</h1>
          <p className="page-subtitle">Scan a returned gallon to receive it into the station for refilling.</p>
        </div>
      </div>

      <div className="scanner-layout">
        <div className="panel">
          <h2>Camera</h2>
          <QrScanner onResult={submitScan} onError={setCameraError} paused={busy} />
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
            <button className="btn btn-outline" type="submit" disabled={busy}>
              Submit
            </button>
          </form>
        </div>

        <div className="panel">
          <h2>Scan Result</h2>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

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
              <button className="btn btn-primary" onClick={registerNotFound} disabled={busy}>
                Register This Gallon
              </button>
            </div>
          )}

          {result && (
            <div className="result-card">
              <p className="mono result-code">{result.qrCode}</p>
              <div className="result-badges">
                <StatusBadge status={result.locationStatus} />
                <StatusBadge status={result.deliveryStatus} />
                <StatusBadge status={result.paymentStatus} />
              </div>

              <label>
                Customer
                <select
                  className="input"
                  value={result.customer?._id || ''}
                  onChange={(e) => assignCustomer(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <div className="result-actions">
                <button className="btn btn-outline" onClick={markDelivered} disabled={result.deliveryStatus === 'delivered'}>
                  Mark Delivered
                </button>
                <button className="btn btn-outline" onClick={markPaid} disabled={result.paymentStatus === 'paid'}>
                  Mark Paid
                </button>
              </div>
            </div>
          )}

          {!result && !notFoundCode && !message && (
            <p className="empty-state">Scan a QR label to see gallon details here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
