const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT, loads the user, and attaches req.user + req.tenantBusinessId.
// This is the single choke point that enforces "a user can only ever act
// within their own business" for every protected route.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });
    }

    req.user = user;
    // Every business-scoped document filter uses this. Never trust a
    // businessId coming from the request body/query for scoping queries.
    req.tenantBusinessId = user.business ? user.business.toString() : null;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect };
