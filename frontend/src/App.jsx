import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { PERMISSIONS } from './utils/permissions';

import Landing from './pages/Landing';
import BusinessLogin from './pages/auth/BusinessLogin';
import BusinessRegister from './pages/auth/BusinessRegister';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerRegister from './pages/auth/CustomerRegister';
import NotFound from './pages/NotFound';

import Dashboard from './pages/owner/Dashboard';
import Customers from './pages/owner/Customers';
import CustomerDetail from './pages/owner/CustomerDetail';
import Plans from './pages/owner/Plans';
import Subscriptions from './pages/owner/Subscriptions';
import Payments from './pages/owner/Payments';
import Invoices from './pages/owner/Invoices';
import Staff from './pages/owner/Staff';
import Reports from './pages/owner/Reports';
import BusinessSettings from './pages/owner/BusinessSettings';
import Profile from './pages/owner/Profile';
import Notifications from './pages/owner/Notifications';

import PortalDashboard from './pages/customer/PortalDashboard';
import PortalSubscription from './pages/customer/PortalSubscription';
import PortalPayments from './pages/customer/PortalPayments';
import PortalInvoices from './pages/customer/PortalInvoices';
import PortalNotifications from './pages/customer/PortalNotifications';

const BUSINESS_ROLES = ['owner', 'manager', 'receptionist'];

// Every business route below is guarded twice: `roles` keeps customers out of
// the business workspace entirely, and `permission` mirrors the exact
// backend permission (see backend/config/permissions.js) so a manager or
// receptionist without the right permission is redirected before the page
// even mounts - not just blocked when an API call 403s.
export default function App() {
  const location = useLocation();
  return (
    <>
      {/* `mode="wait"` plus a pathname-keyed Routes element means each route
          change plays a full exit-then-enter transition (see the fade/slide
          wrapper in ProtectedRoute.jsx) instead of an abrupt swap. */}
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login/business" element={<BusinessLogin />} />
        <Route path="/register/business" element={<BusinessRegister />} />
        <Route path="/login/customer" element={<CustomerLogin />} />
        <Route path="/register/customer" element={<CustomerRegister />} />

        {/* Business workspace */}
        <Route path="/app/dashboard" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.DASHBOARD_VIEW}><Dashboard /></ProtectedRoute>} />
        <Route path="/app/customers" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.CUSTOMER_VIEW}><Customers /></ProtectedRoute>} />
        <Route path="/app/customers/:id" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.CUSTOMER_VIEW}><CustomerDetail /></ProtectedRoute>} />
        <Route path="/app/plans" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.PLAN_MANAGE}><Plans /></ProtectedRoute>} />
        <Route path="/app/subscriptions" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.SUBSCRIPTION_VIEW}><Subscriptions /></ProtectedRoute>} />
        <Route path="/app/payments" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.PAYMENT_VIEW}><Payments /></ProtectedRoute>} />
        <Route path="/app/invoices" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.INVOICE_VIEW_LIST}><Invoices /></ProtectedRoute>} />
        <Route path="/app/billing" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.INVOICE_VIEW_LIST}><Invoices /></ProtectedRoute>} />
        <Route path="/app/staff" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.STAFF_MANAGE}><Staff /></ProtectedRoute>} />
        <Route path="/app/reports" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.REPORTS_VIEW}><Reports /></ProtectedRoute>} />
        <Route path="/app/notifications" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.NOTIFICATIONS_VIEW}><Notifications /></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.BUSINESS_SETTINGS_MANAGE}><BusinessSettings /></ProtectedRoute>} />
        <Route path="/app/profile" element={<ProtectedRoute roles={BUSINESS_ROLES} permission={PERMISSIONS.PROFILE_VIEW_EDIT}><Profile /></ProtectedRoute>} />

        {/* Customer portal */}
        <Route path="/portal/dashboard" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PORTAL_VIEW}><PortalDashboard /></ProtectedRoute>} />
        <Route path="/portal/subscription" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PORTAL_VIEW}><PortalSubscription /></ProtectedRoute>} />
        <Route path="/portal/payments" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PORTAL_VIEW}><PortalPayments /></ProtectedRoute>} />
        <Route path="/portal/invoices" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PORTAL_VIEW}><PortalInvoices /></ProtectedRoute>} />
        <Route path="/portal/notifications" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PORTAL_VIEW}><PortalNotifications /></ProtectedRoute>} />
        <Route path="/portal/profile" element={<ProtectedRoute roles={['customer']} permission={PERMISSIONS.PROFILE_VIEW_EDIT}><Profile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </AnimatePresence>
    </>
  );
}
