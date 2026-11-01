let ioInstance = null;

/** Called once from server.js after the HTTP server is created. */
function initSocket(io) {
  ioInstance = io;
}

/** Any controller/service can import { getIO } to emit, once initSocket has run. */
function getIO() {
  return ioInstance;
}

// Room naming - one room per business (business notification center) and one
// per individual user (so a customer's portal, or in future a specific staff
// member, gets only their own events pushed to them).
const businessRoom = (businessId) => `business:${businessId}`;
const userRoom = (userId) => `user:${userId}`;

module.exports = { initSocket, getIO, businessRoom, userRoom };
