import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Maps a path segment to a human label. Dynamic segments (:id) are handled
// by the caller passing a resolved label via `dynamicLabel`.
const SEGMENT_LABELS = {
  app: 'Business',
  portal: 'Portal',
  dashboard: 'Dashboard',
  customers: 'Customer Management',
  plans: 'Subscription Plans',
  subscriptions: 'Subscription Management',
  billing: 'Billing',
  invoices: 'Invoices',
  payments: 'Payments',
  reports: 'Reports',
  staff: 'Staff Management',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'My Profile',
  subscription: 'My Subscription',
};

export default function Breadcrumbs({ dynamicLabel }) {
  const location = useLocation();
  const params = useParams();

  const segments = location.pathname.split('/').filter(Boolean);
  // Drop the leading workspace segment ("app" / "portal") - the sidebar
  // already establishes that context, so it's redundant in the trail.
  const trail = segments.slice(1);

  if (trail.length === 0) return null;

  const rootTo = segments[0] === 'portal' ? '/portal/dashboard' : '/app/dashboard';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
      <Link to={rootTo} className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400">
        <Home size={13} />
      </Link>
      {trail.map((seg, i) => {
        const isLast = i === trail.length - 1;
        const isId = Object.values(params).includes(seg);
        const label = isId ? dynamicLabel || 'Details' : SEGMENT_LABELS[seg] || seg;
        const to = '/' + segments.slice(0, i + 2).join('/');
        return (
          <span key={to} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            {isLast ? (
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            ) : (
              <Link to={to} className="hover:text-brand-600 dark:hover:text-brand-400">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
