const { notify } = require('./notificationService');

// Every function here builds the subject/message copy for one event type and
// fires it through notify(). Keeping the copy in one place means the wording
// shown in the example spec ("New customer X has been registered...") lives
// in exactly one spot per event, not duplicated across controllers.

async function notifyCustomerRegistered({ business, customer }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'customer_registered',
    subject: 'New Customer Registered',
    message: `New customer ${customer.name} has been registered successfully.`,
  });
}

async function notifySubscriptionActivated({ business, customer, plan }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'subscription_activated',
    subject: 'Subscription Activated',
    message: `${plan.name} subscription activated for ${customer.name}.`,
  });
}

async function notifySubscriptionRenewed({ business, customer, plan, endDate }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'subscription_renewed',
    subject: 'Subscription Renewed',
    message: `${customer.name}'s ${plan.name} subscription was renewed until ${new Date(endDate).toLocaleDateString()}.`,
  });
}

async function notifySubscriptionUpgraded({ business, customer, plan }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'subscription_upgraded',
    subject: 'Subscription Upgraded',
    message: `${customer.name}'s subscription was upgraded to ${plan.name}.`,
  });
}

async function notifySubscriptionExpiringSoon({ business, customer, endDate }) {
  const days = Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)));
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'subscription_expiring_soon',
    subject: 'Subscription Expiring Soon',
    message: `${customer.name}'s subscription will expire in ${days} day${days === 1 ? '' : 's'}.`,
  });
}

async function notifySubscriptionExpired({ business, customer }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'subscription_expired',
    subject: 'Subscription Expired',
    message: `${customer.name}'s subscription has expired.`,
  });
}

async function notifyPaymentReceived({ business, customer, amount, method }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'payment_received',
    subject: 'Payment Received',
    message: `Payment of ₹${Number(amount).toLocaleString('en-IN')} received successfully from ${customer.name} via ${method.replace('_', ' ')}.`,
  });
}

async function notifyPaymentDue({ business, customer, amount, dueDate }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'payment_due',
    subject: 'Payment Due Today',
    message: `${customer.name}'s next installment of ₹${Number(amount).toLocaleString('en-IN')} is due today (${new Date(dueDate).toLocaleDateString()}). Please collect payment.`,
  });
}

async function notifyPaymentFailed({ business, customer, amount, method, reason }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'payment_failed',
    subject: 'Payment Failed',
    message: `Payment attempt of ₹${Number(amount).toLocaleString('en-IN')} via ${method.replace('_', ' ')} for ${customer.name} failed${reason ? `: ${reason}` : '.'}`,
  });
}

async function notifyInvoiceGenerated({ business, customer, invoiceNumber }) {
  return notify({
    business,
    recipientUser: customer.user,
    customer: customer._id,
    type: 'invoice_generated',
    subject: 'Invoice Generated',
    message: `Invoice ${invoiceNumber} generated successfully for ${customer.name}.`,
  });
}

async function notifyPlanCreated({ business, actor, plan }) {
  return notify({
    business,
    recipientUser: actor,
    type: 'plan_created',
    subject: 'New Subscription Plan Created',
    message: `New ${plan.name} subscription plan created (₹${plan.price} / ${plan.billingCycle.replace('_', ' ')}).`,
  });
}

async function notifyPlanUpdated({ business, actor, plan }) {
  return notify({
    business,
    recipientUser: actor,
    type: 'plan_updated',
    subject: 'Subscription Plan Updated',
    message: `The ${plan.name} plan was updated.`,
  });
}

async function notifyStaffAdded({ business, actor, staff }) {
  return notify({
    business,
    recipientUser: actor,
    type: 'staff_added',
    subject: 'Staff Added',
    message: `${staff.name} was added as a ${staff.role}.`,
  });
}

async function notifyStaffDeactivated({ business, actor, staff }) {
  return notify({
    business,
    recipientUser: actor,
    type: 'staff_deactivated',
    subject: 'Staff Deactivated',
    message: `${staff.name} (${staff.role}) was deactivated.`,
  });
}

async function notifyCustomerDeleted({ business, actor, customer }) {
  return notify({
    business,
    recipientUser: actor,
    customer: customer._id,
    type: 'customer_deleted',
    subject: 'Customer Deleted',
    message: `Customer ${customer.name} (${customer.customerId}) was deleted.`,
  });
}

async function notifyCustomerProfileUpdated({ business, customer }) {
  return notify({
    business,
    // The customer's own login always gets this, so they see it on their portal too.
    recipientUser: customer.user,
    customer: customer._id,
    type: 'customer_profile_updated',
    subject: 'Profile Updated',
    message: `${customer.name}'s profile information has been updated.`,
  });
}

module.exports = {
  notifyCustomerRegistered,
  notifySubscriptionActivated,
  notifySubscriptionRenewed,
  notifySubscriptionUpgraded,
  notifySubscriptionExpiringSoon,
  notifySubscriptionExpired,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifyPaymentDue,
  notifyInvoiceGenerated,
  notifyPlanCreated,
  notifyPlanUpdated,
  notifyStaffAdded,
  notifyStaffDeactivated,
  notifyCustomerDeleted,
  notifyCustomerProfileUpdated,
};
