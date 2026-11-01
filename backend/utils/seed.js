/**
 * Optional: creates one demo business (owner) with a couple of plans so you
 * can log in and look around immediately. Run with: npm run seed
 * Safe to run multiple times - it skips creation if the demo owner already exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Business = require('../models/Business');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { generateBusinessId } = require('./idGenerator');

async function seed() {
  await connectDB();

  const email = 'demo-owner@subtrack.dev';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Demo owner already exists:', email);
    process.exit(0);
  }

  const passwordHash = await User.hashPassword('Demo@1234');
  const owner = await User.create({
    fullName: 'Demo Owner',
    email,
    passwordHash,
    role: 'owner',
    phone: '9999999999',
  });

  const businessId = await generateBusinessId('Gym');
  const business = await Business.create({
    businessId,
    name: 'Iron Peak Fitness',
    type: 'Gym',
    address: 'MG Road, Bengaluru',
    owner: owner._id,
  });
  owner.business = business._id;
  await owner.save();

  await SubscriptionPlan.insertMany([
    { business: business._id, name: 'Basic', price: 999, billingCycle: 'monthly', features: ['Gym floor access'] },
    { business: business._id, name: 'Premium', price: 1999, billingCycle: 'monthly', features: ['Gym floor access', 'Group classes', 'Locker'] },
    { business: business._id, name: 'Gold', price: 9999, billingCycle: 'yearly', features: ['Everything in Premium', 'Personal trainer', 'Diet plan'] },
  ]);

  console.log('Seed complete.');
  console.log('  Business ID:', businessId);
  console.log('  Owner login:', email, '/ Demo@1234');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
