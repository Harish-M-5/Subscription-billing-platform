const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { notifyPaymentDue } = require('../utils/notificationEvents');

// Same recurrence lengths used for subscription billing cycles
// (subscriptionController.js keeps its own copy - duplicated here rather
// than imported, since it's just four numbers and not worth a cross-module
// dependency on another controller's internals).
const CYCLE_DAYS = { monthly: 30, quarterly: 91, half_yearly: 182, yearly: 365 };

/**
 * Sweeps every invoice with an active installment plan whose `nextDueDate`
 * has arrived, fires a "payment due today" notification to both the
 * business (Owner/Manager/Receptionist notification center) and the
 * customer's own portal, then advances `nextDueDate` by the plan's
 * frequency so the same due date never re-notifies on a later sweep. An
 * invoice that reaches `paid` status has its plan switched off automatically
 * (nothing left to collect).
 *
 * Run on the same schedule as the subscription status sweep (see
 * server.js); in production, replace the in-process interval with a real
 * cron job / scheduled function, calling this same exported function.
 */
async function runInstallmentDueSweep() {
  const now = new Date();

  const dueInvoices = await Invoice.find({
    'installmentPlan.enabled': true,
    'installmentPlan.nextDueDate': { $lte: now },
    status: { $in: ['pending', 'partial'] },
  });

  let notified = 0;
  for (const invoice of dueInvoices) {
    // eslint-disable-next-line no-await-in-loop
    const customer = await Customer.findById(invoice.customer);
    if (!customer) continue; // eslint-disable-line no-continue

    // eslint-disable-next-line no-await-in-loop
    await notifyPaymentDue({
      business: invoice.business,
      customer,
      amount: invoice.installmentPlan.amount ?? invoice.balanceDue,
      dueDate: invoice.installmentPlan.nextDueDate,
    });
    notified += 1;

    const frequency = invoice.installmentPlan.frequency || 'monthly';
    const next = new Date(invoice.installmentPlan.nextDueDate);
    next.setDate(next.getDate() + (CYCLE_DAYS[frequency] || 30));
    invoice.installmentPlan.nextDueDate = next;
    // eslint-disable-next-line no-await-in-loop
    await invoice.save();
  }

  return { notified };
}

module.exports = { runInstallmentDueSweep };
