import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js';

// Guards every /admin/* route except the login screen itself.
// Customers browsing the public lookup site never pass through this
// at all, since that page lives outside the /admin tree.
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
