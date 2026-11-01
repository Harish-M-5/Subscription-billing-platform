/**
 * Central RBAC permission matrix. This is the ONE place that defines what
 * each role can do - every backend route and the frontend UI both derive
 * from this file (the frontend gets its copy via the `permissions` array
 * returned on login/getMe), so a permission never needs to be checked
 * against a hardcoded list of role names scattered across the codebase.
 *
 * To add a new permission: add a key here with its allowed roles, then use
 * requirePermission('THE_KEY') on the route(s) that need it. To change who
 * can do something: edit the array here, nothing else.
 */

const PERMISSION_ROLES = {
  // Dashboard
  DASHBOARD_VIEW: ['owner', 'manager', 'receptionist'],

  // Reports & analytics
  REPORTS_VIEW: ['owner', 'manager'],

  // Business settings (info, logo, preferences)
  BUSINESS_SETTINGS_VIEW: ['owner'],
  BUSINESS_SETTINGS_MANAGE: ['owner'],
  BUSINESS_LOGO_UPLOAD: ['owner'],
  BUSINESS_ACCOUNT_DELETE: ['owner'],

  // Staff management
  STAFF_VIEW: ['owner'],
  STAFF_MANAGE: ['owner'], // add / edit / deactivate

  // Customer management
  CUSTOMER_VIEW: ['owner', 'manager', 'receptionist'],
  CUSTOMER_ADD: ['owner', 'manager', 'receptionist'],
  CUSTOMER_EDIT: ['owner', 'manager'],
  CUSTOMER_DELETE: ['owner'],

  // Subscription plans (the catalog: Basic/Premium/Gold etc.)
  PLAN_VIEW: ['owner', 'manager'],
  PLAN_MANAGE: ['owner'], // create / edit / deactivate

  // Subscriptions (a customer's actual plan enrollment)
  SUBSCRIPTION_VIEW: ['owner', 'manager', 'receptionist'],
  SUBSCRIPTION_CREATE: ['owner', 'manager'],
  SUBSCRIPTION_RENEW: ['owner', 'manager', 'receptionist'],
  SUBSCRIPTION_UPGRADE: ['owner', 'manager'],
  SUBSCRIPTION_CANCEL: ['owner', 'manager'],

  // Billing / payments
  PAYMENT_RECORD: ['owner', 'manager', 'receptionist'],
  PAYMENT_VIEW: ['owner', 'manager', 'receptionist'],
  INVOICE_VIEW_LIST: ['owner', 'manager'],
  INVOICE_DOWNLOAD: ['owner', 'manager', 'receptionist'],

  // In-app notification center (distinct from Business Settings' toggle for
  // whether email/SMS notifications are sent at all - that's BUSINESS_SETTINGS_MANAGE)
  NOTIFICATIONS_VIEW: ['owner', 'manager', 'receptionist'],

  // Every authenticated account, business or customer, manages its own profile.
  PROFILE_VIEW_EDIT: ['owner', 'manager', 'receptionist', 'customer'],

  // Customer portal (self-service)
  PORTAL_VIEW: ['customer'],
};

/** Returns the sorted list of permission keys a role holds. */
function getPermissionsForRole(role) {
  return Object.keys(PERMISSION_ROLES)
    .filter((key) => PERMISSION_ROLES[key].includes(role))
    .sort();
}

/** True if `role` is one of the roles allowed for `permission`. */
function roleHasPermission(role, permission) {
  const allowed = PERMISSION_ROLES[permission];
  return Array.isArray(allowed) && allowed.includes(role);
}

module.exports = { PERMISSION_ROLES, getPermissionsForRole, roleHasPermission };
