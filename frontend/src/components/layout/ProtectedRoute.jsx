import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/UI';
import { hasPermission } from '../../utils/permissions';

// A subtle fade + slide-up, applied once here rather than in every page
// file - combined with the pathname-keyed <AnimatePresence mode="wait"> in
// App.jsx, this is what gives every authenticated page a smooth transition
// on route change.
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

// RBAC gate for a route. Pass `permission` for fine-grained, backend-mirrored
// checks (preferred - e.g. permission={PERMISSIONS.REPORTS_VIEW}); `roles` is
// still supported for the coarse business-vs-customer split. If both are
// given, the user must satisfy both. A user who is authenticated but lacks
// the required permission/role is redirected home rather than shown a blank
// or broken page - this is the frontend half of RBAC; the backend enforces
// the same rule independently on every API call.
export default function ProtectedRoute({ children, roles, permission }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (permission && !hasPermission(user, permission)) return <Navigate to="/" replace />;

  return <motion.div {...pageTransition}>{children}</motion.div>;
}
