import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar.js';
import CustomerHeader from './components/CustomerHeader.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import Dashboard from './pages/Dashboard.js';
import Gallons from './pages/Gallons.js';
import Scanner from './pages/Scanner.js';
import Customers from './pages/Customers.js';
import CustomerDetail from './pages/CustomerDetail.js';
import PublicLookup from './pages/PublicLookup.js';
import AdminLogin from './pages/AdminLogin.js';
import Transactions from './pages/Transactions.js';
import './styles/layout.css';

// Public shell: what customers see. No navigation to the staff
// console exists anywhere on this side of the app.
function CustomerLayout({ children }) {
  return (
    <div className="app-shell customer-shell">
      <CustomerHeader />
      <main className="app-main">{children}</main>
      <footer className="app-footer">Aquamom Water Refilling Station</footer>
    </div>
  );
}

// Staff shell: the gallon-tracking and customer-management console,
// gated behind ProtectedRoute so it always requires a signed-in session.
function AdminLayout({ children }) {
  return (
    <div className="app-shell admin-shell">
      <AdminSidebar />
      <main className="app-main admin-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public customer-facing site */}
      <Route
        path="/"
        element={
          <CustomerLayout>
            <PublicLookup />
          </CustomerLayout>
        }
      />
      <Route path="/lookup" element={<Navigate to="/" replace />} />

      {/* Staff login, outside the protected admin shell */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Staff console, gated by session */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/gallons"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Gallons />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scanner"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Scanner />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Customers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CustomerDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Transactions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <CustomerLayout>
            <div className="page">
              <h2>Page not found</h2>
            </div>
          </CustomerLayout>
        }
      />
    </Routes>
  );
}
