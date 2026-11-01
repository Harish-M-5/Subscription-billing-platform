// Usage: authorize('owner', 'manager') - allows only listed roles through.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action.`,
      });
    }
    next();
  };
}

// Blocks any non-business user (customers) from hitting business-management routes.
function businessUserOnly(req, res, next) {
  if (!['owner', 'manager', 'receptionist'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Business account required.' });
  }
  if (!req.tenantBusinessId) {
    return res.status(403).json({ success: false, message: 'No business associated with this account.' });
  }
  next();
}

module.exports = { authorize, businessUserOnly };
