// server/admin/handler/premium.js
const { approvedUsers, pendingUsers } = require('../../connection/db');
const { isAdmin } = require('../../utils/helpers');

let premiumMode = false;
const getPremiumMode = () => premiumMode;

const checkPremiumMode = (chatId, bot) => {
  console.log(`Checking Premium Mode for Chat ID: ${chatId}`);
  if (premiumMode && !approvedUsers.has(chatId) && !isAdmin(chatId)) {
    bot.sendMessage(chatId, '❌ Premium mode is enabled. You need admin approval to use this bot.');
    return false;
  }
  return true;
};

const togglePremiumMode = (chatId, bot) => {
  premiumMode = !premiumMode;
  bot.sendMessage(chatId, `✅ Premium mode is now ${premiumMode ? 'ON' : 'OFF'}.`);
  if (premiumMode) notifyPendingUsersAboutPremium(bot);
};

const notifyPendingUsersAboutPremium = (bot) => {
  pendingUsers.forEach(userId => {
    if (!approvedUsers.has(userId)) {
      bot.sendMessage(userId, '❌ Premium mode is ON. You need admin approval to use the bot.');
    }
  });
};

const register = (bot) => {
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'toggle_premium' && isAdmin(chatId)) {
      togglePremiumMode(chatId, bot);

      const status = premiumMode ? 'ON' : 'OFF';

      // Clone the existing inline keyboard and update only the Premium button text
      const keyboard = query.message.reply_markup.inline_keyboard.map(row =>
        row.map(button => {
          if (button.callback_data === 'toggle_premium') {
            return { ...button, text: `🔑 Premium (${status})` };
          }
          return button;
        })
      );

      bot.editMessageReplyMarkup(
        { inline_keyboard: keyboard },
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
    }

    bot.answerCallbackQuery(query.id);
  });
};

module.exports = {
  checkPremiumMode,
  getPremiumMode,
  register
};