const fs = require('fs');
const {
  pendingUsers,
  approvedUsers,
  suspendedUsers,
  timerUsers,
  pendingUsersFile,
} = require('../../connection/db');
const { getPremiumMode } = require('../../admin/handler/premium');
const { getRemainingTime } = require('../../admin/handler/timeruser');

function getUserStatus(chatId) {
  let status = "Free";
  let message = "You can use the bot freely.";
  let notifyAdminFlag = false;

  if (getPremiumMode()) {
    if (approvedUsers.has(chatId)) {
      status = "Premium User";

      if (timerUsers.has(chatId)) {
        const { expireTime } = timerUsers.get(chatId);
        const remaining = getRemainingTime(expireTime);

        message =
          `⚠️ *Premium Mode is ON.*\n` +
          `⌛ Remaining Time: ${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes\n\n` +
          `You can use all premium features until expired time.`;
      } else {
        message = 
          `⚠️ *Premium Mode is ON.*\n` +
          `You can use all premium features.`;
      }

    } else if (pendingUsers.has(chatId)) {
      status = "Pending Approval";
      message = "⚠️ *Premium Mode is ON*. Approval is required to access the bot.";
    } else if (suspendedUsers.has(chatId)) {
      status = "Suspended";
      message = "⚠️ *Premium Mode is ON*. Approval is required to access the bot.";
    } else {
      // New user, add to pending
      pendingUsers.add(chatId);
      try {
        const pendingArr = Array.from(pendingUsers);
        fs.writeFileSync(pendingUsersFile, JSON.stringify(pendingArr, null, 2));
        notifyAdminFlag = true;
      } catch (error) {
        console.error("❌ Failed to save pending users:", error);
      }

      status = "Pending Approval";
      message = "⚠️ *Premium Mode is ON*. Approval is required to access the bot.";
    }
  }

  return { status, message, notifyAdminFlag };
}

module.exports = { getUserStatus };
