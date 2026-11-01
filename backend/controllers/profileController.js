const User = require('../models/User');
const Customer = require('../models/Customer');
const Staff = require('../models/Staff');
const Business = require('../models/Business');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyCustomerProfileUpdated } = require('../utils/notificationEvents');

// GET /api/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const business = user.business ? await Business.findById(user.business) : null;

  let extra = {};
  if (user.role === 'customer' && user.customerProfile) {
    const customer = await Customer.findById(user.customerProfile).populate({
      path: 'currentSubscription',
      populate: { path: 'plan', select: 'name price billingCycle' },
    });
    extra = { customer };
  } else if (['manager', 'receptionist'].includes(user.role) && user.staffProfile) {
    const staff = await Staff.findById(user.staffProfile);
    extra = { staff };
  }

  res.json({
    success: true,
    profile: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl,
      business,
      ...extra,
    },
  });
});

// PUT /api/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, profilePhotoUrl } = req.body;
  const user = req.user;

  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (profilePhotoUrl !== undefined) user.profilePhotoUrl = profilePhotoUrl;
  await user.save();

  // Keep denormalized copies in sync
  if (user.role === 'customer' && user.customerProfile) {
    const customer = await Customer.findByIdAndUpdate(
      user.customerProfile,
      {
        ...(fullName && { name: fullName }),
        ...(phone !== undefined && { phone }),
        ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
      },
      { new: true }
    );
    if (customer) await notifyCustomerProfileUpdated({ business: customer.business, customer });
  }
  if (['manager', 'receptionist'].includes(user.role) && user.staffProfile) {
    await Staff.findByIdAndUpdate(user.staffProfile, {
      ...(fullName && { name: fullName }),
      ...(phone !== undefined && { phone }),
      ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
    });
  }

  res.json({ success: true, message: 'Profile updated.' });
});

// PUT /api/profile/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }
  const user = req.user;
  const match = await user.comparePassword(currentPassword);
  if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
});

// DELETE /api/profile  { password }
// Permanently deletes the account (and, for an Owner, cascades are NOT
// automatic here on purpose — see README for the intentional business-data
// retention rule). Email/Business ID/Customer ID are never reused because
// the underlying unique-indexed documents are never deleted, only the User.
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Password confirmation required.' });

  const user = req.user;
  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' });

  if (user.role === 'owner') {
    return res.status(400).json({
      success: false,
      message:
        'Owner accounts cannot self-delete while the business is active. Transfer ownership or contact support to close the business.',
    });
  }

  user.isActive = false;
  user.deletedAt = new Date();
  // Anonymize identifying fields but keep the record so email can't be reused
  // and historical payments/invoices keep a valid reference.
  user.email = `deleted_${user._id}@deleted.local`;
  await user.save();

  if (user.role === 'customer' && user.customerProfile) {
    await Customer.findByIdAndUpdate(user.customerProfile, { isActive: false });
  }

  res.json({ success: true, message: 'Account deleted.' });
});

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
