const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

const { asyncHandler } = require('../middleware/errorHandler');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1);
}

// GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const businessId = new mongoose.Types.ObjectId(req.tenantBusinessId);
  const today = startOfDay();
  const monthStart = startOfMonth();
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  const [
    totalCustomers,
    activeCustomers,
    expiredCustomers,
    expiringSoon,
    todayRevenueAgg,
    monthRevenueAgg,
    pendingPaymentsAgg,
    recentPayments,
    recentActivity,
  ] = await Promise.all([
    Customer.countDocuments({ business: businessId, isActive: true }),
    Customer.countDocuments({ business: businessId, isActive: true, subscriptionStatus: 'active' }),
    Customer.countDocuments({ business: businessId, isActive: true, subscriptionStatus: 'expired' }),
    Subscription.countDocuments({ business: businessId, status: 'active', endDate: { $lte: soon, $gte: new Date() } }),
    Payment.aggregate([
      { $match: { business: businessId, status: 'paid', paidAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { business: businessId, status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // "Pending payments" = outstanding balance across unpaid/partially-paid
    // invoices - not Payment records, since every recorded Payment is
    // already a completed transaction (partial or full).
    Invoice.aggregate([
      { $match: { business: businessId, status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' }, count: { $sum: 1 } } },
    ]),
    Payment.find({ business: businessId }).populate('customer', 'name customerId').sort({ paidAt: -1 }).limit(5),
    AuditLog.find({ business: businessId }).populate('actor', 'fullName role').sort({ createdAt: -1 }).limit(10),
  ]);

  res.json({
    success: true,
    summary: {
      totalCustomers,
      activeCustomers,
      expiredCustomers,
      expiringSoon,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
      monthlyRevenue: monthRevenueAgg[0]?.total || 0,
      pendingPayments: {
        total: pendingPaymentsAgg[0]?.total || 0,
        count: pendingPaymentsAgg[0]?.count || 0,
      },
    },
    recentPayments,
    recentActivity,
  });
});

// GET /api/dashboard/reports?range=daily|monthly|yearly
const getReports = asyncHandler(async (req, res) => {
  const businessId = new mongoose.Types.ObjectId(req.tenantBusinessId);
  const { range = 'monthly' } = req.query;

  let groupFormat;
  let since;
  if (range === 'daily') {
    groupFormat = '%Y-%m-%d';
    since = new Date();
    since.setDate(since.getDate() - 30);
  } else if (range === 'yearly') {
    groupFormat = '%Y';
    since = new Date();
    since.setFullYear(since.getFullYear() - 5);
  } else {
    groupFormat = '%Y-%m';
    since = new Date();
    since.setMonth(since.getMonth() - 12);
  }

  const revenueSeries = await Payment.aggregate([
    { $match: { business: businessId, status: 'paid', paidAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$paidAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [activeCustomers, expiredCustomers, pendingInvoicesCount] = await Promise.all([
    Customer.countDocuments({ business: businessId, subscriptionStatus: 'active' }),
    Customer.countDocuments({ business: businessId, subscriptionStatus: 'expired' }),
    Invoice.countDocuments({ business: businessId, status: { $in: ['pending', 'partial'] } }),
  ]);

  res.json({
    success: true,
    range,
    revenueSeries,
    activeCustomers,
    expiredCustomers,
    pendingPayments: pendingInvoicesCount,
  });
});

module.exports = { getSummary, getReports };
