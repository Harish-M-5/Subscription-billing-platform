import { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, FileText, Layers, UserCog,
  BarChart3, Settings, Menu, X, Building2, Bell, Search, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Breadcrumbs from './Breadcrumbs';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import QuickHelp from './QuickHelp';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

// One flat nav list per workspace, each item tagged with the exact
// permission that gates it (matching backend/config/permissions.js 1:1), and
// a `group` so the sidebar can divide "day to day" items from administrative
// ones with a small section label - matching the reference screenshot's
// "SETTINGS" divider above Admin Panel.
const BUSINESS_NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW, group: 'main' },
  { to: '/app/customers', label: 'Customer Management', icon: Users, permission: PERMISSIONS.CUSTOMER_VIEW, group: 'main' },
  { to: '/app/plans', label: 'Subscription Plans', icon: Layers, permission: PERMISSIONS.PLAN_MANAGE, group: 'main' },
  { to: '/app/subscriptions', label: 'Subscription Management', icon: FileText, permission: PERMISSIONS.SUBSCRIPTION_VIEW, group: 'main' },
  { to: '/app/billing', label: 'Billing', icon: FileText, permission: PERMISSIONS.INVOICE_VIEW_LIST, group: 'main' },
  { to: '/app/payments', label: 'Payments', icon: CreditCard, permission: PERMISSIONS.PAYMENT_VIEW, group: 'main' },
  { to: '/app/reports', label: 'Reports', icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW, group: 'main' },
  { to: '/app/staff', label: 'Staff Management', icon: UserCog, permission: PERMISSIONS.STAFF_MANAGE, group: 'admin' },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW, group: 'admin' },
  { to: '/app/settings', label: 'Settings', icon: Settings, permission: PERMISSIONS.BUSINESS_SETTINGS_MANAGE, group: 'admin' },
];

const PORTAL_NAV = [
  { to: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.PORTAL_VIEW, group: 'main' },
  { to: '/portal/subscription', label: 'My Subscription', icon: Layers, permission: PERMISSIONS.PORTAL_VIEW, group: 'main' },
  { to: '/portal/payments', label: 'Payment History', icon: CreditCard, permission: PERMISSIONS.PORTAL_VIEW, group: 'main' },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText, permission: PERMISSIONS.PORTAL_VIEW, group: 'main' },
  { to: '/portal/notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.PORTAL_VIEW, group: 'main' },
];

// The active pill is a shared-layout motion element (layoutId): when the
// active route changes to a different NavItem, framer-motion automatically
// animates the highlight sliding from its old position to the new one
// instead of an abrupt class swap - the signature Linear/Vercel-style
// "magic motion" sidebar effect.
function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNavPill"
              className="absolute inset-0 rounded-xl bg-pastel-blue dark:bg-brand-950/50 border-l-4 border-brand-600"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <Icon size={18} className="relative shrink-0" />
          <span className="relative truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function DashboardShell({ children, breadcrumbLabel }) {
  const { user, business } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navSource = user?.role === 'customer' ? PORTAL_NAV : BUSINESS_NAV;
  const items = navSource.filter((item) => hasPermission(user, item.permission));
  const mainItems = items.filter((i) => i.group === 'main');
  const adminItems = items.filter((i) => i.group === 'admin');
  const profilePath = user?.role === 'customer' ? '/portal/profile' : '/app/profile';
  const canSearchCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/app/customers?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div className="min-h-screen flex bg-canvas dark:bg-ink-1000">
      {/* Mobile overlay - tapping outside the drawer closes it */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* The hamburger (3-line) icon toggles this drawer on mobile/tablet;
          on desktop (lg+) it's permanently docked. Only the modules the
          logged-in role actually has permission for appear inside it. */}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 sm:w-64 shrink-0 transform border-r border-slate-200 dark:border-white/10 bg-white dark:bg-ink-950 transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-5 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 p-1.5 text-white">
            <Building2 size={18} />
          </div>
          <span className="font-display font-bold text-lg text-gradient">SubTrack</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {business && (
          <div className="mx-4 mt-4 rounded-2xl bg-slate-50 dark:bg-white/5 p-3 flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-ink-900 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 size={18} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{business.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {business.type}{business.customType ? ` · ${business.customType}` : ''}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">{business.businessId}</p>
            </div>
          </div>
        )}

        <nav className="mt-4 flex flex-col gap-1 px-3 overflow-y-auto flex-1">
          {mainItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="mt-4 mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin</p>
              {adminItems.map((item) => (
                <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
              ))}
            </>
          )}

          {hasPermission(user, PERMISSIONS.PROFILE_VIEW_EDIT) && (
            <NavItem to={profilePath} label="My Profile" icon={UserCog} onClick={() => setOpen(false)} />
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-ink-950/80 backdrop-blur px-3 sm:px-4 lg:px-6">
          <button
            className="lg:hidden shrink-0 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Quick customer search, like the reference screenshot's top search bar. */}
          {canSearchCustomers && (
            <form onSubmit={submitSearch} className="hidden md:block relative w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers…"
                className="w-full rounded-xl bg-slate-100 dark:bg-white/10 border-0 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </form>
          )}

          <div className="flex-1" />

          {/* Business branding in the top navigation, for both staff and customers */}
          {business && (
            <div className="hidden lg:flex items-center gap-2.5 pr-1 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={14} className="text-slate-400" />
                )}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold truncate">{business.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{business.type}</p>
              </div>
            </div>
          )}

          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Breadcrumbs dynamicLabel={breadcrumbLabel} />
          {children}
        </main>
      </div>

      {/* Floating quick-help button, bottom-right - matching the reference screenshot's floating action button. */}
      <button
        onClick={() => setShowHelp((s) => !s)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 dark:bg-brand-600 text-white shadow-floating transition hover:scale-105 active:scale-95"
        aria-label="Quick help"
      >
        <Sparkles size={22} />
      </button>
      <QuickHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
