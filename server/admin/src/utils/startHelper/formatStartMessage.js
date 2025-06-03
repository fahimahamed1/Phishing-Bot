const {
  approvedUsers,
  pendingUsers,
  suspendedUsers,
  timerUsers,
} = require('../../connection/db');

function formatStartMessage({ chatId, fullName, isAdmin = false, status = "", message = "" }) {
  if (isAdmin) {
    return (
      `👋 Welcome, ${fullName}!\n` +
      `😊 You are an *Admin*.\n` +
      `🆔 Chat ID: \`${chatId}\`\n` +
      `🔹 Account Status: *Full Access*\n\n` +
      `📊 *User Stats:*\n` +
      `👥 Total Approved Users: ${approvedUsers.size}\n` +
      `⏳ Pending: ${pendingUsers.size}\n` +
      `🚫 Suspended: ${suspendedUsers.size}\n` +
      `⏲️ Timer Users: ${timerUsers.size}`
    );
  }

  return (
    `👋 Welcome, ${fullName}!\n` +
    `🆔 Chat ID: \`${chatId}\`\n` +
    `🔹 Account Status: *${status}*\n\n` +
    `${message}`
  );
}

module.exports = { formatStartMessage };
