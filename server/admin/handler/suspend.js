const fs = require('fs');
const {
  approvedUsers,
  suspendedUsers,
  approvedUsersFile,
  suspendedUsersFile
} = require('../src/connection/db');
const { safeEditMessageText } = require('../src/utils/safeEditMessageText');
const { isAdmin } = require('../src/utils/checkadmin');

// Back button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Show list of approved users for suspension (3 buttons per row)
function showSuspendOptions(chatId, bot, messageId = null) {
  const text = approvedUsers.size === 0
    ? 'No approved users to suspend.'
    : '⏳ *Select a user to suspend:*';

  const keyboard = [];
  let row = [];

  [...approvedUsers].forEach((userId, index) => {
    row.push({
      text: `Suspend ${userId}`,
      callback_data: `suspend_${userId}`
    });

    if (row.length === 3 || index === approvedUsers.size - 1) {
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

// Register suspend user callback logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(err =>
      console.error('Failed to answer callback query:', err.message)
    );

    if (!isAdmin(chatId)) return;

    // Show suspension options
    if (data === 'suspend_user') {
      return showSuspendOptions(chatId, bot, messageId);
    }

    // Handle suspension action
    if (data.startsWith('suspend_')) {
      const userId = parseInt(data.replace('suspend_', ''));
      if (isNaN(userId)) return;

      if (!approvedUsers.has(userId)) {
        return bot.sendMessage(chatId, '⚠️ User is not in the approved list.');
      }

      try {
        approvedUsers.delete(userId);
        suspendedUsers.add(userId);

        fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
        fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));

        bot.sendMessage(userId, '❌ You have been suspended and can no longer use the bot.');

        // Refresh list
        showSuspendOptions(chatId, bot, messageId);

      } catch (err) {
        console.error('❌ Error updating user status:', err.message);
        bot.sendMessage(chatId, '❌ Failed to suspend user due to a system error.');
      }
    }

    // Handle back button
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
