import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [quickForm, setQuickForm] = useState({ customer: '', price: 30, size: 'Round' });
  const [showModal, setShowModal] = useState(false);

  // Name-based lookup: search customers by name, then pick which of their
  // gallons to act on, instead of typing a QR code by hand.
  const [nameQuery, setNameQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerGallons, setCustomerGallons] = useState([]);
  const [gallonsLoading, setGallonsLoading] = useState(false);
  const [gallonsError, setGallonsError] = useState('');
  const searchBoxRef = useRef(null);

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

  // Close the suggestions dropdown when clicking outside the search box.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingCustomers =
    nameQuery.trim() && !selectedCustomer
      ? customers
          .filter((c) => c.name.toLowerCase().includes(nameQuery.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  const resetCustomerSearch = () => {
    setNameQuery('');
    setSelectedCustomer(null);
    setCustomerGallons([]);
    setGallonsError('');
    setShowSuggestions(false);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setNameQuery(customer.name);
    setShowSuggestions(false);
    setGallonsError('');
    setGallonsLoading(true);
    api
      .get('/gallons', { params: { customer: customer._id } })
      .then((res) => setCustomerGallons(res.data))
      .catch((err) => setGallonsError(errorMessage(err, 'Failed to load this customer\'s gallons.')))
      .finally(() => setGallonsLoading(false));
  };

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

  const selectGallon = (gallon) => {
    submitScan(gallon.qrCode);
    resetCustomerSearch();
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
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="scanner-page">
        <div className="panel">
          <h2>Camera</h2>
          <QrScanner onResult={submitScan} onError={setCameraError} paused={busy || showModal} />
          {cameraError && (
            <div className="alert alert-error camera-error-alert">
              {cameraError}. You can still look the gallon up by customer name below.
            </div>
          )}

          <div className="customer-search" ref={searchBoxRef}>
            <label className="customer-search-label" htmlFor="scanner-name-search">
              Or find it by customer name
            </label>
            <div className="customer-search-input-row">
              <input
                id="scanner-name-search"
                className="input"
                placeholder="Search customer by name..."
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value);
                  setSelectedCustomer(null);
                  setCustomerGallons([]);
                  setGallonsError('');
                  setShowSuggestions(true);
                }}
                onFocus={() => nameQuery.trim() && !selectedCustomer && setShowSuggestions(true)}
                autoComplete="off"
              />
              {(nameQuery || selectedCustomer) && (
                <button
                  type="button"
                  className="icon-button customer-search-clear"
                  onClick={resetCustomerSearch}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {showSuggestions && matchingCustomers.length > 0 && (
              <div className="customer-suggestions">
                {matchingCustomers.map((c) => (
                  <button
                    type="button"
                    key={c._id}
                    className="customer-suggestion-item"
                    onClick={() => selectCustomer(c)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && nameQuery.trim() && !selectedCustomer && matchingCustomers.length === 0 && (
              <div className="customer-suggestions">
                <div className="customer-suggestion-empty">No customers match "{nameQuery.trim()}".</div>
              </div>
            )}

            {selectedCustomer && (
              <div className="customer-gallon-picker">
                {gallonsLoading && <p className="muted text-sm">Loading gallons...</p>}
                {gallonsError && <div className="alert alert-error">{gallonsError}</div>}

                {!gallonsLoading && !gallonsError && customerGallons.length === 0 && (
                  <p className="muted text-sm">
                    {selectedCustomer.name} has no gallons on record yet.
                  </p>
                )}

                {!gallonsLoading && customerGallons.length > 0 && (
                  <>
                    <p className="customer-gallon-picker-label">
                      Select a gallon to scan for {selectedCustomer.name}:
                    </p>
                    <div className="customer-gallon-list">
                      {customerGallons.map((g) => (
                        <button
                          type="button"
                          key={g._id}
                          className="customer-gallon-option"
                          onClick={() => selectGallon(g)}
                          disabled={busy}
                        >
                          <span className="customer-gallon-option-main">
                            <span className="mono">{g.qrCode}</span>
                            <span className="muted text-sm">{g.size} &bull; PHP {g.price}</span>
                          </span>
                          <span className="customer-gallon-option-badges">
                            <StatusBadge status={g.deliveryStatus} />
                            <StatusBadge status={g.paymentStatus} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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
              <button className="btn btn-primary btn-block mt-md" onClick={registerNotFound} disabled={busy}>
                Register This Gallon
              </button>
            </div>
          )}

          {result && (
            <div className="result-card result-card-tight">
              <div className="result-header">
                <p className="mono result-code">
                  {result.qrCode}
                </p>
                <div className="result-badges">
                  <StatusBadge status={result.locationStatus} />
                  <StatusBadge status={result.deliveryStatus} />
                  <StatusBadge status={result.paymentStatus} />
                </div>
              </div>

              <div className="result-summary">
                <div>
                  <span className="muted text-sm">Customer: </span>
                  <strong>{result.customer?.name || 'Unassigned'}</strong>
                </div>
                <div>
                  <span className="muted text-sm">Size / Price: </span>
                  <strong>{result.size} (PHP {result.price})</strong>
                </div>
              </div>

              <button className="btn btn-primary btn-block mt-lg" onClick={closeModal}>
                Done
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}