const Business = require('../models/Business');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

const BUSINESS_TYPE_CODE = {
  Gym: 'GYM',
  Clinic: 'CLN',
  'Coaching Institute': 'COA',
  'Tuition Center': 'TUI',
  Salon: 'SAL',
  'Yoga Center': 'YOG',
  'Dance Academy': 'DAN',
  'Music Academy': 'MUS',
  'Sports Academy': 'SPO',
  'Training Center': 'TRN',
  Other: 'OTH',
};

function randomDigits(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// BUS-GYM-00123 style, guaranteed unique via retry loop
async function generateBusinessId(businessType) {
  const code = BUSINESS_TYPE_CODE[businessType] || 'OTH';
  let id;
  let exists = true;
  while (exists) {
    id = `BUS-${code}-${randomDigits(5)}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Business.exists({ businessId: id });
  }
  return id;
}

// CUS-2026-00001 style, unique per year
async function generateCustomerId() {
  const year = new Date().getFullYear();
  let id;
  let exists = true;
  while (exists) {
    id = `CUS-${year}-${randomDigits(5)}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Customer.exists({ customerId: id });
  }
  return id;
}

// INV-2026-000001 style, unique
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  let id;
  let exists = true;
  while (exists) {
    id = `INV-${year}-${randomDigits(6)}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Invoice.exists({ invoiceNumber: id });
  }
  return id;
}

module.exports = { generateBusinessId, generateCustomerId, generateInvoiceNumber };
