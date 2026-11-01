require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocket, businessRoom, userRoom } = require('./utils/socket');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const staffRoutes = require('./routes/staffRoutes');
const customerRoutes = require('./routes/customerRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const portalRoutes = require('./routes/portalRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limit as a safety net on top of the stricter auth limiter.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Serve uploaded profile photos / logos.
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const { runSubscriptionStatusSweep } = require('./jobs/subscriptionStatusJob');
const { runInstallmentDueSweep } = require('./jobs/installmentDueJob');

// A plain http.Server wraps the Express app so Socket.io can share the same
// port - no separate WebSocket server/port to configure or expose.
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});

// Every socket connection must present the same JWT used for REST calls
// (sent as `auth: { token }` from the client). This is the real-time
// transport's own authentication - it never trusts a bare business/user ID
// from the client, only what the verified token resolves to.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Not authenticated.'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new Error('Not authenticated.'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Not authenticated.'));
  }
});

io.on('connection', (socket) => {
  const { user } = socket;
  // Business staff join their business's shared room (the Notification
  // Center is business-wide); everyone also joins a personal room, which is
  // what the customer portal - and any future per-staff-member alerts - use.
  if (user.business) socket.join(businessRoom(user.business.toString()));
  socket.join(userRoom(user._id.toString()));

  // CRITICAL: without this, a write to a socket that the client has already
  // disconnected (tab closed, refresh, network drop - all routine, not
  // exceptional, for WebSocket connections) throws an unhandled 'error'
  // event and crashes the entire Node process, taking down every API route
  // (including unrelated ones like PDF download) until the server is
  // manually restarted. This is exactly the ECONNABORTED crash class.
  socket.on('error', (err) => {
    console.error(`Socket error (user ${user._id}):`, err.message);
  });
});

// Transport/handshake-level errors (e.g. a connection aborted mid-upgrade)
// surface here rather than as a socket 'connection' event - same crash risk
// if left unhandled.
io.engine.on('connection_error', (err) => {
  console.error('Socket.io connection error:', err.message || err.code || err);
});

// Server-level errors (rare, but same unhandled-'error'-crashes-the-process rule applies).
httpServer.on('error', (err) => {
  console.error('HTTP server error:', err.message);
});

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`API server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));

// Last-resort safety net. This is a long-running server handling many
// concurrent WebSocket connections; a transient error from one client's
// dropped connection must never take down every other business's and
// customer's active session. We log everything (nothing is silently
// swallowed) and keep the process alive rather than crash on every network
// hiccup - the alternative is exactly the repeated "server crashed, nothing
// works until I manually restart it" problem this is fixing.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept running):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection (server kept running):', reason);
});

// Lightweight in-process scheduler for dev/small deployments. In production,
// replace this with a real cron job (or AWS EventBridge + Lambda) hitting
// the same runSubscriptionStatusSweep() function so it survives restarts
// and scales across multiple app instances without double-running.
setInterval(() => {
  runSubscriptionStatusSweep().catch((err) => console.error('Status sweep failed:', err.message));
}, 60 * 60 * 1000); // hourly

// Same pattern for installment/recurring payment reminders - checks for any
// invoice whose next installment due date has arrived and notifies the
// business + customer. Same production note as above applies.
setInterval(() => {
  runInstallmentDueSweep().catch((err) => console.error('Installment due sweep failed:', err.message));
}, 60 * 60 * 1000); // hourly

module.exports = app;
