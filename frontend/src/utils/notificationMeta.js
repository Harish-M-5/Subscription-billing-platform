import {
  UserPlus, UserCheck, UserX, UserCog, Layers, RefreshCw, ArrowUpCircle,
  Clock, AlarmClockOff, CreditCard, XCircle, FileText, PackagePlus, PackageCheck,
  Bell, CalendarClock,
} from 'lucide-react';

// One entry per Notification.type (backend/models/Notification.js
// NOTIFICATION_TYPES). `tone` matches the Badge tones in components/ui/UI.jsx.
// Used by the navbar bell dropdown and both full Notification Center pages,
// so every surface renders a given event type identically.
export const NOTIFICATION_META = {
  customer_registered: { label: 'New Customer', icon: UserPlus, tone: 'blue' },
  customer_profile_updated: { label: 'Profile Updated', icon: UserCog, tone: 'slate' },
  customer_deleted: { label: 'Customer Deleted', icon: UserX, tone: 'red' },
  subscription_activated: { label: 'Subscription Activated', icon: Layers, tone: 'green' },
  subscription_renewed: { label: 'Subscription Renewed', icon: RefreshCw, tone: 'green' },
  subscription_upgraded: { label: 'Subscription Upgraded', icon: ArrowUpCircle, tone: 'purple' },
  subscription_expiring_soon: { label: 'Expiring Soon', icon: Clock, tone: 'amber' },
  subscription_expired: { label: 'Subscription Expired', icon: AlarmClockOff, tone: 'red' },
  payment_received: { label: 'Payment Received', icon: CreditCard, tone: 'green' },
  payment_failed: { label: 'Payment Failed', icon: XCircle, tone: 'red' },
  payment_due: { label: 'Payment Due Today', icon: CalendarClock, tone: 'amber' },
  invoice_generated: { label: 'Invoice Generated', icon: FileText, tone: 'blue' },
  plan_created: { label: 'Plan Created', icon: PackagePlus, tone: 'purple' },
  plan_updated: { label: 'Plan Updated', icon: PackageCheck, tone: 'purple' },
  staff_added: { label: 'Staff Added', icon: UserPlus, tone: 'blue' },
  staff_deactivated: { label: 'Staff Deactivated', icon: UserX, tone: 'slate' },
};

export function getNotificationMeta(type) {
  return NOTIFICATION_META[type] || { label: type, icon: Bell, tone: 'slate' };
}

// Backend messages are written in third person ("Harish M's profile...",
// "...for Rahul Kumar.") so they read correctly in the shared business feed.
// On a customer's own portal, lightly personalize the common "<name>'s ..."
// prefix pattern to second person to match the spec's customer-facing
// wording ("Your profile information has been updated.") without needing a
// second copy of every message stored server-side.
export function personalizeForCustomer(message, customerName) {
  if (!customerName) return message;
  const prefix = `${customerName}'s `;
  if (message.startsWith(prefix)) {
    return 'Your ' + message.slice(prefix.length);
  }
  return message;
}
