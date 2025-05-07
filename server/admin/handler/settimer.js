const fs = require('fs');
const { users, timerUsers, approvedUsers, timerUsersFile } = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { isAdmin } = require('../../utils/checkadmin');

// Prompt to select a user for setting a timer
const promptSetTimer = (chatId, bot, messageId = null) => {
  const buttons = [...approvedUsers]
    .filter(userId => !timerUsers.has(userId))
    .map(userId => ({ text: `Set Timer for ${userId}`, callback_data: `set_timer_${userId}` }));

  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 3) {
    keyboard.push(buttons.slice(i, i + 3));
  }

  if (keyboard.length === 0) {
    const text = '❌ All approved users already have timers.';
    const replyMarkup = { inline_keyboard: [[{ text: '⬅️ Back to Admin Panel', callback_data: 'back_to_admin_panel' }]] };
    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup);
  }

  const text = '⏳ *Select a user to set a timer:*';
  const replyMarkup = { inline_keyboard: keyboard.concat([[{ text: '⬅️ Back to Admin Panel', callback_data: 'back_to_admin_panel' }]]) };

  if (messageId) {
    safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  } else {
    bot.sendMessage(chatId, text, { reply_markup: replyMarkup, parse_mode: 'Markdown' });
  }
};

// Ask for duration after selecting a user
const setTimerForUser = (chatId, userId, bot, messageId) => {
  const text = `Please enter the number of days for the validity period for User ${userId}:`;
  bot.sendMessage(chatId, text);
  users[chatId] = { step: 'entering_timer', userId, messageId };
};

// Handle logic for setting timers
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(err => console.error('Failed to answer callback query:', err.message));

    // Admin check
    if (!isAdmin(chatId)) return;

    // View user selection for timer
    if (data === 'set_timer') {
      return promptSetTimer(chatId, bot, messageId);
    }

    // Select user to set a timer
    if (data.startsWith('set_timer_')) {
      const userId = parseInt(data.replace('set_timer_', ''), 10);
      if (!isNaN(userId)) {
        return setTimerForUser(chatId, userId, bot, messageId);
      }
    }

    // Handle Back button click
    if (data === 'back_to_admin_panel') {
      const { adminPanelButtons } = require('../admin');
      safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
        inline_keyboard: adminPanelButtons,
        parse_mode: 'Markdown'
      });
    }
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (users[chatId]?.step === 'entering_timer') {
      const days = parseInt(msg.text);
      const userId = users[chatId].userId;

      // Validate the input days
      if (isNaN(days) || days <= 0) {
        return bot.sendMessage(chatId, '❌ Invalid input. Please enter a valid number of days (greater than 0).');
      }

      const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
      timerUsers.set(userId, { validityDays: days, expireTime });

      // Update the timer users data
      fs.writeFileSync(timerUsersFile, JSON.stringify(Object.fromEntries(timerUsers), null, 2));

      // Notify the admin and user
      bot.sendMessage(chatId, `✅ User ${userId} granted ${days} day(s) of access.`);
      bot.sendMessage(userId, `✅ You have been granted ${days} day(s) of access to the bot.`);

      // Clear the current step
      users[chatId].step = null;
    }
  });
}

module.exports = {
  register
};
