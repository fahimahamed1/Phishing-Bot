const fs = require('fs');
const {
  approvedUsers,
  suspendedUsers,
  approvedUsersFile,
  suspendedUsersFile
} = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { isAdmin } = require('../../utils/checkadmin');

// Back button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Show list of suspended users (3 buttons per row)
function showSuspendedUsers(chatId, bot, messageId = null) {
  const text = suspendedUsers.size === 0
    ? '✅ No suspended users.'
    : '⏳ *Suspended Users:*';

  const keyboard = [];
  let row = [];

  [...suspendedUsers].forEach((userId, index) => {
    row.push({
      text: `Approve ${userId}`,
      callback_data: `approve_suspended_${userId}`
    });

    if (row.length === 3 || index === suspendedUsers.size - 1) {
      keyboard.push(row);
      row = [];
    }
  });

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

// Register suspend logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(err =>
      console.error('Failed to answer callback query:', err.message)
    );

    if (!isAdmin(chatId)) return;

    // View suspended users
    if (data === 'view_suspended') {
      return showSuspendedUsers(chatId, bot, messageId);
    }

    // Approve previously suspended user
    if (data.startsWith('approve_suspended_')) {
      const userId = parseInt(data.replace('approve_suspended_', ''), 10);
      if (isNaN(userId)) return;

      if (!suspendedUsers.has(userId)) {
        return bot.sendMessage(chatId, '❌ This user is not in the suspended list.');
      }

      try {
        suspendedUsers.delete(userId);
        approvedUsers.add(userId);

        fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));
        fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));

        bot.sendMessage(userId, '✅ You have been approved! You can now use the bot.');

        // Refresh list
        showSuspendedUsers(chatId, bot, messageId);
      } catch (err) {
        console.error('❌ Error updating user status:', err.message);
        return bot.sendMessage(chatId, '❌ Failed to approve suspended user due to a system error.');
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
