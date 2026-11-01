const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const { notifySubscriptionExpiringSoon, notifySubscriptionExpired } = require('../utils/notificationEvents');

/**
 * Sweeps all active subscriptions and flips status:
 *   active -> expiring_soon  (within the business's threshold, default 7 days)
 *   active/expiring_soon -> expired (past endDate)
 * Fires a notification exactly once per transition (the queries below only
 * ever match subscriptions still in their *previous* state, so a sweep never
 * re-notifies for a transition that already happened on an earlier run).
 * Run this on a schedule (see server.js interval, or wire it to a real cron
 * job / AWS EventBridge rule in production instead of an in-process interval).
 */
async function runSubscriptionStatusSweep() {
  const now = new Date();

  // Expire anything past its end date first.
  const expired = await Subscription.find({ status: { $in: ['active', 'expiring_soon'] }, endDate: { $lt: now } });
  for (const sub of expired) {
    sub.status = 'expired';
    // eslint-disable-next-line no-await-in-loop
    await sub.save();
    // eslint-disable-next-line no-await-in-loop
    const customer = await Customer.findById(sub.customer);
    if (customer) {
      // eslint-disable-next-line no-await-in-loop
      await notifySubscriptionExpired({ business: sub.business, customer });
    }
  }

  // Flag upcoming expirations per-business threshold.
  const active = await Subscription.find({ status: 'active' });
  const settingsCache = new Map();
  for (const sub of active) {
    const bizId = sub.business.toString();
    if (!settingsCache.has(bizId)) {
      // eslint-disable-next-line no-await-in-loop
      const s = await Settings.findOne({ business: sub.business });
      settingsCache.set(bizId, s?.expiringSoonThresholdDays ?? 7);
    }
    const threshold = settingsCache.get(bizId);
    const soonCutoff = new Date();
    soonCutoff.setDate(soonCutoff.getDate() + threshold);
    if (sub.endDate <= soonCutoff) {
      sub.status = 'expiring_soon';
      // eslint-disable-next-line no-await-in-loop
      await sub.save();
      // eslint-disable-next-line no-await-in-loop
      const customer = await Customer.findById(sub.customer);
      if (customer) {
        // eslint-disable-next-line no-await-in-loop
        await notifySubscriptionExpiringSoon({ business: sub.business, customer, endDate: sub.endDate });
      }
    }
  }

  // Re-sync every customer whose subscriptions changed.
  const touchedCustomerIds = new Set([...expired, ...active].map((s) => s.customer.toString()));
  for (const customerId of touchedCustomerIds) {
    // eslint-disable-next-line no-await-in-loop
    const latest = await Subscription.findOne({
      customer: customerId,
      status: { $in: ['active', 'expiring_soon'] },
    }).sort({ endDate: -1 });
    // eslint-disable-next-line no-await-in-loop
    await Customer.findByIdAndUpdate(customerId, {
      currentSubscription: latest ? latest._id : null,
      subscriptionStatus: latest ? latest.status : 'expired',
    });
  }

  return { expiredCount: expired.length, checkedActive: active.length };
}

module.exports = { runSubscriptionStatusSweep };
