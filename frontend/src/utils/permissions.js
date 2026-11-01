// Mirrors backend/config/permissions.js by name only - the actual list of
// permissions a user holds always comes from the server (user.permissions,
// set at login/register/me and never computed locally), so the frontend
// can never grant itself access the backend wouldn't also allow. These
// constants just give call sites a typo-proof name to check against.
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  REPORTS_VIEW: 'REPORTS_VIEW',
  BUSINESS_SETTINGS_VIEW: 'BUSINESS_SETTINGS_VIEW',
  BUSINESS_SETTINGS_MANAGE: 'BUSINESS_SETTINGS_MANAGE',
  BUSINESS_LOGO_UPLOAD: 'BUSINESS_LOGO_UPLOAD',
  BUSINESS_ACCOUNT_DELETE: 'BUSINESS_ACCOUNT_DELETE',
  STAFF_VIEW: 'STAFF_VIEW',
  STAFF_MANAGE: 'STAFF_MANAGE',
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_ADD: 'CUSTOMER_ADD',
  CUSTOMER_EDIT: 'CUSTOMER_EDIT',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  PLAN_VIEW: 'PLAN_VIEW',
  PLAN_MANAGE: 'PLAN_MANAGE',
  SUBSCRIPTION_VIEW: 'SUBSCRIPTION_VIEW',
  SUBSCRIPTION_CREATE: 'SUBSCRIPTION_CREATE',
  SUBSCRIPTION_RENEW: 'SUBSCRIPTION_RENEW',
  SUBSCRIPTION_UPGRADE: 'SUBSCRIPTION_UPGRADE',
  SUBSCRIPTION_CANCEL: 'SUBSCRIPTION_CANCEL',
  PAYMENT_RECORD: 'PAYMENT_RECORD',
  PAYMENT_VIEW: 'PAYMENT_VIEW',
  INVOICE_VIEW_LIST: 'INVOICE_VIEW_LIST',
  INVOICE_DOWNLOAD: 'INVOICE_DOWNLOAD',
  NOTIFICATIONS_VIEW: 'NOTIFICATIONS_VIEW',
  PROFILE_VIEW_EDIT: 'PROFILE_VIEW_EDIT',
  PORTAL_VIEW: 'PORTAL_VIEW',
};

/** True if the given user object holds `permission`. Safe against a null user. */
export function hasPermission(user, permission) {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
}

/** True if the user holds at least one of the listed permissions. */
export function hasAnyPermission(user, permissionList) {
  return permissionList.some((p) => hasPermission(user, p));
}
