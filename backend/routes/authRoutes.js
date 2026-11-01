const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { registerBusiness, registerCustomer, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Basic brute-force protection on auth endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/business/register', authLimiter, registerBusiness);
router.post('/customer/register', authLimiter, registerCustomer);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
