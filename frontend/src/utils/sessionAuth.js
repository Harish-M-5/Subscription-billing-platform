// Auth state (token/user/business) is deliberately stored in sessionStorage,
// NOT localStorage.
//
// localStorage is shared across every tab of the same browser/origin - so
// logging in as a Customer in one tab would silently overwrite an Owner's
// session already open in another tab (and vice versa), making it
// impossible to use the app as both a business user and a customer at the
// same time on one machine. sessionStorage is scoped per-tab: each browser
// tab gets its own independent copy, so opening the app in two tabs and
// logging into two different roles just works, with zero risk of one
// session clobbering the other. The trade-off is that a session doesn't
// survive closing the tab (it's not meant to - that's what makes it
// per-tab); this is the standard, correct pattern for "multiple concurrent
// sessions in one browser."
const KEYS = ['token', 'user', 'business'];

export function getAuthItem(key) {
  return sessionStorage.getItem(key);
}

export function setAuthItem(key, value) {
  sessionStorage.setItem(key, value);
}

export function clearAuthStorage() {
  KEYS.forEach((k) => sessionStorage.removeItem(k));
}
