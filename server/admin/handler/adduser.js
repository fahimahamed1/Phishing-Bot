const fs = require('fs');
const {
  users,
  approvedUsers,
  approvedUsersFile
} = require('../../connection/db');

const { isAdmin } = require('../../utils/checkAdmin');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');

// Create the Back to Admin Panel button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Prompt admin to enter chat IDs
const promptForChatIds = (chatId, bot, messageId = null) => {
  const text = '📥 Please provide the Chat ID(s) of the user(s) you want to approve:\n\nYou can send them separated by commas, spaces, or new lines.';
  const markup = {
    inline_keyboard: [[createBackButton()]]
  };

  users[chatId] = { step: 'entering_chatids' };

  if (messageId) {
    return safeEditMessageText(bot, chatId, messageId, text, markup);
  } else {
    return bot.sendMessage(chatId, text, {
      reply_markup: markup
    });
  }
};

// Add custom users after admin sends chat IDs
const handleAddCustomUsers = (chatId, enteredChatIds, bot) => {
  const normalizedInput = enteredChatIds.replace(/[,|\n]/g, ' ');
  const chatIds = normalizedInput.split(' ').map(id => id.trim()).filter(id => id.length > 0);

  const newlyApproved = [];
  const alreadyApproved = [];
  const invalidIds = [];

  for (const id of chatIds) {
    const chatIdInt = parseInt(id);

    if (isNaN(chatIdInt)) {
      invalidIds.push(id);
      continue;
    }

    if (approvedUsers.has(chatIdInt)) {
      alreadyApproved.push(chatIdInt);
      continue;
    }

    approvedUsers.add(chatIdInt);
    newlyApproved.push(chatIdInt);

    bot.sendMessage(chatIdInt, '✅ You have been approved and can now use the bot.');
  }

  fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers], null, 2));

  let message = '';
  if (newlyApproved.length > 0) {
    message += `✅ Newly approved users:\n${newlyApproved.join('\n')}\n\n`;
  }
  if (alreadyApproved.length > 0) {
    message += `⚠️ Already approved users:\n${alreadyApproved.join('\n')}\n\n`;
  }
  if (invalidIds.length > 0) {
    message += `❌ Invalid IDs (not numbers):\n${invalidIds.join('\n')}`;
  }

  bot.sendMessage(chatId, message.trim());
  users[chatId].step = null;
};

// Register callback and message handler
const register = (bot) => {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (!isAdmin(chatId)) return;

    bot.answerCallbackQuery(callbackQuery.id).catch(console.error);

    if (data === 'add_custom_user') {
      return promptForChatIds(chatId, bot, messageId);
    }

    if (data === 'back_to_admin_panel') {
      const { adminPanelButtons } = require('../admin');
      return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
        inline_keyboard: adminPanelButtons,
        parse_mode: 'Markdown'
      });
    }
  });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const step = users[chatId]?.step;

    if (!isAdmin(chatId)) return;

    if (step === 'entering_chatids') {
      handleAddCustomUsers(chatId, msg.text, bot);
    }
  });
};

module.exports = {
  register
};
