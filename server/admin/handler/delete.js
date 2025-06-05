const fs = require('fs');
const {
  approvedUsers,
  pendingUsers,
  suspendedUsers,
  timerUsers,
  approvedUsersFile,
  pendingUsersFile,
  suspendedUsersFile,
  timerUsersFile
} = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { isAdmin } = require('../../utils/checkAdmin'); // <-- import isAdmin

// Create Back Button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Utility: Remove user from all lists but leave the timer intact
const deleteUserFromLists = (userId) => {
  let removed = false;

  if (approvedUsers.has(userId)) {
    approvedUsers.delete(userId);
    fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers], null, 2));
    removed = true;
  }
  if (pendingUsers.has(userId)) {
    pendingUsers.delete(userId);
    fs.writeFileSync(pendingUsersFile, JSON.stringify([...pendingUsers], null, 2));
    removed = true;
  }
  if (suspendedUsers.has(userId)) {
    suspendedUsers.delete(userId);
    fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers], null, 2));
    removed = true;
  }
  return removed;
};

// Show deletion or timer removal options for all users (with up to 3 buttons per row)
const showDeletionOptions = (chatId, bot, messageId = null) => {
  const allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];
  const timerUsersList = [...timerUsers.keys()];
  const usersToDisplay = [...new Set([...allUsers, ...timerUsersList])];

  let text = '';
  const inlineKeyboard = [];

  if (usersToDisplay.length === 0) {
    text = '❌ *No users to delete or remove timer.*';
  } else {
    text = '⏳ *Select a user to delete or remove timer:*';

    const buttons = [];

    usersToDisplay.forEach(userId => {
      buttons.push({
        text: `🗑 ${userId}`,
        callback_data: `user_delete_${userId}`
      });

      if (timerUsersList.includes(userId) || timerUsersList.includes(String(userId))) {
        buttons.push({
          text: `🕒 Timer ${userId}`,
          callback_data: `delete_timer_${userId}`
        });
      }
    });

    // Arrange up to 3 buttons per row
    for (let i = 0; i < buttons.length; i += 3) {
      inlineKeyboard.push(buttons.slice(i, i + 3));
    }
  }

  // Always add back button
  inlineKeyboard.push([createBackButton()]);

  if (messageId) {
    return safeEditMessageText(bot, chatId, messageId, text, { inline_keyboard: inlineKeyboard }, 'Markdown');
  } else {
    return bot.sendMessage(chatId, text, {
      reply_markup: { inline_keyboard: inlineKeyboard },
      parse_mode: 'Markdown'
    });
  }
};

// Register handler for user deletion and timer removal
const register = (bot) => {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    // Block non-admins silently here
    if (!isAdmin(chatId)) return;

    bot.answerCallbackQuery(callbackQuery.id).catch(console.error);

    if (data === 'delete_user') {
      return showDeletionOptions(chatId, bot, messageId);
    }

    if (data.startsWith('user_delete_')) {
      const userId = Number(data.replace('user_delete_', ''));
      deleteUserFromLists(userId);

      return showDeletionOptions(chatId, bot, messageId);
    }

    if (data.startsWith('delete_timer_')) {
      const userId = Number(data.replace('delete_timer_', ''));
      if (timerUsers.has(userId) || timerUsers.has(String(userId))) {
        timerUsers.delete(userId);
        timerUsers.delete(String(userId));

        try {
          const timerObj = Object.fromEntries(timerUsers);
          fs.writeFileSync(timerUsersFile, JSON.stringify(timerObj, null, 2));
          bot.sendMessage(userId, "❌ Your timer has been removed by an admin.");
        } catch (err) {
          console.error(err);
        }
      }
      return showDeletionOptions(chatId, bot, messageId);
    }

    if (data === 'back_to_admin_panel') {
      const { adminPanelButtons } = require('../admin');
      return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
        inline_keyboard: adminPanelButtons,
        parse_mode: 'Markdown'
      });
    }
  });
};

module.exports = {
  register
};
