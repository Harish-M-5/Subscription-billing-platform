const { roleHasPermission } = require('../config/permissions');

/**
 * requirePermission('SOME_PERMISSION') - the standard way to protect a route.
 * Looks up the permission in config/permissions.js and checks the logged-in
 * user's role against it. Must run after `protect` (needs req.user).
 *
 * Unauthenticated -> 401 (handled by `protect` already running first).
 * Authenticated but wrong role -> 403 Forbidden, per the RBAC spec.
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roleHasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: your role ('${req.user.role}') does not have permission to perform this action.`,
        permission,
      });
    }
    next();
  };
}

/**
 * requireAnyPermission('A', 'B') - passes if the user holds at least one of
 * the listed permissions. Useful when a route legitimately serves more than
 * one distinct capability (rare - prefer a single specific permission).
 */
function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const allowed = permissions.some((p) => roleHasPermission(req.user.role, p));
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: your role ('${req.user.role}') does not have permission to perform this action.`,
        permissions,
      });
    }
    next();
  };
}

module.exports = { requirePermission, requireAnyPermission };
