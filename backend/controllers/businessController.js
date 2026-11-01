const Business = require('../models/Business');
const Settings = require('../models/Settings');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../utils/audit');

// GET /api/business/me
const getMyBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.tenantBusinessId);
  const settings = await Settings.findOne({ business: req.tenantBusinessId });
  res.json({ success: true, business, settings });
});

// PUT /api/business/me  (owner only)
// businessId is immutable by schema - even an owner can never change it.
const updateMyBusiness = asyncHandler(async (req, res) => {
  const { name, address, logoUrl } = req.body;
  const business = await Business.findById(req.tenantBusinessId);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  if (name) business.name = name;
  if (address !== undefined) business.address = address;
  if (logoUrl !== undefined) business.logoUrl = logoUrl;
  await business.save();

  await logAction({
    business: business._id,
    actor: req.user._id,
    action: 'business.update',
    entityType: 'Business',
    entityId: business._id,
  });

  res.json({ success: true, business });
});

// PUT /api/business/settings (owner only)
const updateSettings = asyncHandler(async (req, res) => {
  const { expiringSoonThresholdDays, notifications, currency, theme } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { business: req.tenantBusinessId },
    {
      $set: {
        ...(expiringSoonThresholdDays !== undefined && { expiringSoonThresholdDays }),
        ...(notifications !== undefined && { notifications }),
        ...(currency !== undefined && { currency }),
        ...(theme !== undefined && { theme }),
      },
    },
    { new: true, upsert: true }
  );
  res.json({ success: true, settings });
});

module.exports = { getMyBusiness, updateMyBusiness, updateSettings };
