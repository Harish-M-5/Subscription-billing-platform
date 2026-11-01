const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const Customer = require('../models/Customer');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateBusinessId, generateCustomerId } = require('../utils/idGenerator');
const { getPermissionsForRole } = require('../config/permissions');
const { notifyCustomerRegistered } = require('../utils/notificationEvents');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Every auth response includes `permissions` - the frontend's single source
// of truth for which menus/buttons/pages to show, mirroring exactly what the
// backend will enforce on each route. Never derive UI visibility from the
// role name alone on the frontend; always check this list instead.
function publicUser(user, extra = {}) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: getPermissionsForRole(user.role),
    profilePhotoUrl: user.profilePhotoUrl,
    business: user.business,
    ...extra,
  };
}

// POST /api/auth/business/register
// Registers a new Owner + creates their Business, generates a permanent Business ID.
const registerBusiness = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, businessName, businessType, customType, address } = req.body;

  if (!fullName || !email || !password || !businessName || !businessType) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const passwordHash = await User.hashPassword(password);

  // Create user first (owner), then business referencing it, then link back.
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: 'owner',
  });

  const businessId = await generateBusinessId(businessType);
  const business = await Business.create({
    businessId,
    name: businessName,
    type: businessType,
    customType: businessType === 'Other' ? customType : null,
    address,
    owner: user._id,
  });

  user.business = business._id;
  await user.save();

  const token = signToken(user);
  res.status(201).json({
    success: true,
    token,
    user: publicUser(user),
    business,
  });
});

// POST /api/auth/customer/register
// Verifies the Business ID exists, then creates a Customer permanently linked to it.
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone, businessId } = req.body;

  if (!name || !email || !password || !businessId) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const business = await Business.findOne({ businessId: businessId.trim().toUpperCase(), isActive: true });
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business ID not found. Please check and try again.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    fullName: name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: 'customer',
    business: business._id,
  });

  const customerId = await generateCustomerId();
  const customer = await Customer.create({
    customerId,
    business: business._id,
    user: user._id,
    name,
    email: email.toLowerCase(),
    phone,
  });

  user.customerProfile = customer._id;
  await user.save();

  await notifyCustomerRegistered({ business: business._id, customer });

  const token = signToken(user);
  res.status(201).json({
    success: true,
    token,
    user: publicUser(user, { customerId: customer.customerId }),
    business,
  });
});

// POST /api/auth/login
// Single login endpoint for all 4 roles - role comes back in the response
// so the frontend routes to the correct dashboard.
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = signToken(user);
  const business = user.business ? await Business.findById(user.business) : null;

  res.json({
    success: true,
    token,
    user: publicUser(user),
    business,
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const business = req.user.business ? await Business.findById(req.user.business) : null;
  res.json({ success: true, user: publicUser(req.user), business });
});

// Logout is stateless (JWT) - client just discards the token.
// This endpoint exists for symmetry / future token-blacklist support.
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out.' });
});

module.exports = { registerBusiness, registerCustomer, login, getMe, logout };
