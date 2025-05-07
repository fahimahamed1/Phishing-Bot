// server/admin/handler/timersuser.js
const { timerUsers } = require('../../connection/db');

// Calculate remaining time
function getRemainingTime(expireTime) {
  const now = Date.now();
  const remaining = Math.max(0, expireTime - now);

  return {
    days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
    hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  };
}

// Show all users with active timers
function viewTimerUsers(chatId, bot) {
  if (timerUsers.size === 0) {
    return bot.sendMessage(chatId, '❌ No users with active timers.');
  }

  let message = "⏳ *Active Timer Users:*\n\n";
  for (const [userId, timer] of timerUsers.entries()) {
    const expireDate = new Date(timer.expireTime);
    const remaining = getRemainingTime(timer.expireTime);

    message += `👤 *User ID:* ${userId}\n`;
    message += `📅 *Duration:* ${timer.validityDays} days\n`;
    message += `⏳ *Expires At:* ${expireDate.toLocaleString()}\n`;
    message += `⌛ *Remaining:* ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m\n`;
    message += `-----------------------\n`;
  }

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

// Register logic to view timer users
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'view_timer_users') {
      return viewTimerUsers(chatId, bot);
    }
  });
}

module.exports = {
  register,
  getRemainingTime
};