// server/admin/handler/timersuser.js

const { timerUsers, approvedUsers, suspendedUsers, timerUsersFile, approvedUsersFile, suspendedUsersFile } = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { isAdmin } = require('../../utils/checkadmin');
const fs = require('fs');

// Save timerUsers data
function saveTimerUsers() {
  const data = {};
  for (const [userId, timer] of timerUsers.entries()) {
    data[userId] = timer;
  }
  fs.writeFileSync(timerUsersFile, JSON.stringify(data, null, 2), 'utf8');
}

// Save approved users
function saveApprovedUsers() {
  fs.writeFileSync(approvedUsersFile, JSON.stringify(Array.from(approvedUsers), null, 2), 'utf8');
}

// Save suspended users
function saveSuspendedUsers() {
  fs.writeFileSync(suspendedUsersFile, JSON.stringify(Array.from(suspendedUsers), null, 2), 'utf8');
}

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

// Send expiration alert to a user
function sendExpirationAlert(userId, bot, remainingTime) {
  const message = `⚠️ *Your access is about to expire in:* ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m\nPlease take action to extend your access.`;
  bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
}

// View all timer users
function viewTimerUsers(chatId, bot, messageId) {
  if (timerUsers.size === 0) {
    const text = '❌ No users with active timers.';
    const replyMarkup = {
      inline_keyboard: [
        [{ text: '⬅️ Back to Admin Panel', callback_data: 'back_to_admin_panel' }]
      ]
    };
    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  }

  let text = '⏳ *Active Timer Users:*\n\n';

  for (const [userId, timer] of timerUsers.entries()) {
    const expireDate = new Date(timer.expireTime);
    const remaining = getRemainingTime(timer.expireTime);

    text += `👤 *User ID:* ${userId}\n`;
    text += `📅 *Duration:* ${timer.validityDays} days\n`;
    text += `⏳ *Expires At:* ${expireDate.toLocaleString()}\n`;
    text += `⌛ *Remaining:* ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m\n`;
    text += `-----------------------\n`;
  }

  const replyMarkup = {
    inline_keyboard: [
      [{ text: '⬅️ Back to Admin Panel', callback_data: 'back_to_admin_panel' }]
    ]
  };

  safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
}

// Check timers and move expired users
function checkTimersAndAlert(bot) {
  const now = Date.now();
  const alertThreshold = 60 * 60 * 1000; // 1 hour in milliseconds
  let changed = false;

  for (const [userId, timer] of timerUsers.entries()) {
    const remainingTime = timer.expireTime - now;

    if (remainingTime <= 0) {
      timerUsers.delete(userId);
      console.log(`Timer expired for user: ${userId}`);

      if (approvedUsers.has(userId)) {
        approvedUsers.delete(userId);
        suspendedUsers.add(userId);
        console.log(`User ${userId} moved from Approved to Suspended.`);
      }

      changed = true;
    } else if (remainingTime <= alertThreshold) {
      const remaining = getRemainingTime(timer.expireTime);
      sendExpirationAlert(userId, bot, remaining);
    }
  }

  // Save only if data changed
  if (changed) {
    saveTimerUsers();
    saveApprovedUsers();
    saveSuspendedUsers();
  }
}

// Handle callback query events for timer users
function handleCallbackQuery(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  if (!isAdmin(chatId)) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Access Denied.', show_alert: true });
  }

  if (data === 'view_timer_users') {
    viewTimerUsers(chatId, bot, messageId);
  } else if (data === 'back_to_admin_panel') {
    const { adminPanelButtons } = require('../admin');
    safeEditMessageText(
      bot,
      chatId,
      messageId,
      '🔧 *Admin Panel:* Choose an option:',
      { inline_keyboard: adminPanelButtons },
      'Markdown'
    );
  }
}

// Register event handlers
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;

    if (data === 'view_timer_users' || data === 'back_to_admin_panel') {
      handleCallbackQuery(bot, callbackQuery);
    }
  });

  // Periodically check for expired timers every hour
  setInterval(() => {
    checkTimersAndAlert(bot);
  }, 60 * 60 * 1000);
}

module.exports = {
  register,
  getRemainingTime,
  checkTimersAndAlert
};
