const Staff = require('../models/Staff');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../utils/audit');
const { notifyStaffAdded, notifyStaffDeactivated } = require('../utils/notificationEvents');

// GET /api/staff  (owner only)
const listStaff = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = { business: req.tenantBusinessId };
  if (!includeInactive) filter.isActive = true;
  const staff = await Staff.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, staff });
});

// POST /api/staff  (owner only) - creates a User + Staff record together
const addStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  if (!['manager', 'receptionist'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be manager or receptionist.' });
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
    role,
    business: req.tenantBusinessId,
  });

  const staff = await Staff.create({
    business: req.tenantBusinessId,
    user: user._id,
    name,
    email: email.toLowerCase(),
    phone,
    role,
  });

  user.staffProfile = staff._id;
  await user.save();

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'staff.add',
    entityType: 'Staff',
    entityId: staff._id,
  });
  await notifyStaffAdded({ business: req.tenantBusinessId, actor: req.user._id, staff });

  res.status(201).json({ success: true, staff });
});

// PUT /api/staff/:id  (owner only)
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

  const { name, phone, role } = req.body;
  if (name) staff.name = name;
  if (phone !== undefined) staff.phone = phone;
  if (role && ['manager', 'receptionist'].includes(role)) {
    staff.role = role;
    await User.findByIdAndUpdate(staff.user, { role });
  }
  await staff.save();

  res.json({ success: true, staff });
});

// DELETE /api/staff/:id  (owner only) - SOFT delete only, per spec.
const deactivateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id, business: req.tenantBusinessId });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

  staff.isActive = false;
  staff.deactivatedAt = new Date();
  await staff.save();

  // Deactivate login too, but never delete the User/Staff documents -
  // historical invoices/payments reference staff.user as recordedBy/generatedBy.
  await User.findByIdAndUpdate(staff.user, { isActive: false, deletedAt: new Date() });

  await logAction({
    business: req.tenantBusinessId,
    actor: req.user._id,
    action: 'staff.deactivate',
    entityType: 'Staff',
    entityId: staff._id,
  });
  await notifyStaffDeactivated({ business: req.tenantBusinessId, actor: req.user._id, staff });

  res.json({ success: true, message: 'Staff member deactivated.', staff });
});

module.exports = { listStaff, addStaff, updateStaff, deactivateStaff };
