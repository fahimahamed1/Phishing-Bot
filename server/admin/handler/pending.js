const fs = require('fs');
const {
  pendingUsers,
  approvedUsers,
  pendingUsersFile,
  approvedUsersFile
} = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { isAdmin } = require('../../utils/checkadmin');

// Create the Back to Admin Panel button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Show pending users with approval buttons (3 per row)
function showPendingUsers(chatId, bot, messageId = null) {
  const text = pendingUsers.size === 0
    ? 'No pending users.'
    : '⏳ *Pending Users:*';

  const keyboard = [];
  let row = [];

  [...pendingUsers].forEach((userId, index) => {
    row.push({
      text: `Approve ${userId}`,
      callback_data: `approve_${userId}`
    });

    if (row.length === 3 || index === pendingUsers.size - 1) {
      keyboard.push(row);
      row = [];
    }
  });

  // Add back button
  keyboard.push([createBackButton()]);

  const replyMarkup = { inline_keyboard: keyboard };

  if (messageId) {
    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  } else {
    return bot.sendMessage(chatId, text, {
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
  }
}

// Register the button click handling for the approval logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch((err) =>
      console.error('Failed to answer callback query:', err.message)
    );

    // Admin check
    if (!isAdmin(chatId)) return;

    // View pending users
    if (data === 'view_pending') {
      return showPendingUsers(chatId, bot, messageId);
    }

    // Approve user
    if (data.startsWith('approve_')) {
      const userId = parseInt(data.replace('approve_', ''));
      if (isNaN(userId)) return;

      if (!pendingUsers.has(userId)) {
        return bot.sendMessage(chatId, '⚠️ User is no longer in the pending list.');
      }

      try {
        pendingUsers.delete(userId);
        approvedUsers.add(userId);

        fs.writeFileSync(pendingUsersFile, JSON.stringify([...pendingUsers]));
        fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));

        bot.sendMessage(userId, '✅ You have been approved! You can now use the bot.');

        // Refresh the list
        showPendingUsers(chatId, bot, messageId);

      } catch (err) {
        console.error('❌ Error saving user status:', err.message);
        bot.sendMessage(chatId, '❌ Failed to approve user due to a system error.');
      }
    }

    // Back to admin panel
    if (data === 'back_to_admin_panel') {
      const { adminPanelButtons } = require('../admin');
      return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
        inline_keyboard: adminPanelButtons,
        parse_mode: 'Markdown'
      });
    }
  });
}

module.exports = {
  register
};
