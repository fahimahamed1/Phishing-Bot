// server/admin/handler/settimer.js
const fs = require('fs');
const { users, timerUsers, approvedUsers, timerUsersFile } = require('../../connection/db');

// Prompt to select a user for setting timer
const promptSetTimer = (chatId, bot) => {
  const keyboard = [...approvedUsers]
    .filter((userId) => !timerUsers.has(userId))
    .map((userId) => [{ text: `Set Timer for ${userId}`, callback_data: `set_timer_${userId}` }]);

  if (keyboard.length === 0) {
    return bot.sendMessage(chatId, '❌ All approved users already have timers.');
  }

  bot.sendMessage(chatId, '⏳ Select a user to set a timer:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};

// Ask for duration after selecting user
const setTimerForUser = (chatId, userId, bot) => {
  bot.sendMessage(chatId, 'Please enter the number of days for the validity period:');
  users[chatId] = { step: 'entering_timer', userId };
};

// Handle logic for setting timers
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'set_timer') {
      return promptSetTimer(chatId, bot);
    }

    if (data.startsWith('set_timer_')) {
      const userId = parseInt(data.replace('set_timer_', ''));
      if (!isNaN(userId)) {
        setTimerForUser(chatId, userId, bot);
      }
    }
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (users[chatId]?.step === 'entering_timer') {
      const days = parseInt(msg.text);
      const userId = users[chatId].userId;

      if (isNaN(days)) {
        return bot.sendMessage(chatId, '❌ Invalid number. Please enter a valid number of days.');
      }

      const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
      timerUsers.set(userId, { validityDays: days, expireTime });

      fs.writeFileSync(timerUsersFile, JSON.stringify(Object.fromEntries(timerUsers), null, 2));

      bot.sendMessage(chatId, `✅ User ${userId} granted ${days} day(s).`);
      bot.sendMessage(userId, `✅ You have been granted ${days} day(s) of access.`);

      users[chatId].step = null;
    }
  });
}

module.exports = {
  register
};