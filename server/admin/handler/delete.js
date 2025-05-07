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

// Utility: Remove user from all sets
const deleteUserFromSets = (userId) => {
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

// Display user list for deletion or timer removal
const showDeletionOptions = (chatId, bot) => {
  const allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];

  if (allUsers.length === 0) {
    return bot.sendMessage(chatId, '❌ No users to delete.');
  }

  const keyboard = allUsers.map(userId => {
    const deleteButton = { text: `🗑 Delete ${userId}`, callback_data: `user_delete_confirm_${userId}` };
    const timerButton = (timerUsers.has(userId) || timerUsers.has(String(userId)))
      ? { text: `🕒 Remove Timer ${userId}`, callback_data: `delete_timer_${userId}` }
      : null;

    return timerButton ? [deleteButton, timerButton] : [deleteButton];
  });

  bot.sendMessage(chatId, '⏳ Select a user to delete or remove timer:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};

// Register handler
const register = (bot) => {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(console.error);

    // Entry point: button from admin panel
    if (data === 'delete_user') {
      return showDeletionOptions(chatId, bot);
    }

    // Ask confirmation before deleting
    if (data.startsWith('user_delete_confirm_')) {
      const userId = Number(data.replace('user_delete_confirm_', ''));
      const confirmKeyboard = {
        inline_keyboard: [
          [{ text: '✅ Yes, delete', callback_data: `user_delete_final_${userId}` }],
          [{ text: '❌ Cancel', callback_data: 'user_delete_cancel' }]
        ]
      };
      return bot.sendMessage(chatId, `⚠️ Are you sure you want to delete User ID ${userId}?`, {
        reply_markup: confirmKeyboard
      });
    }

    // Perform actual deletion
    if (data.startsWith('user_delete_final_')) {
      const userId = Number(data.replace('user_delete_final_', ''));
      const removed = deleteUserFromSets(userId);
      return bot.sendMessage(chatId, removed
        ? `✅ User ${userId} has been deleted.`
        : `⚠️ User ${userId} was not found in any list.`);
    }

    // Cancel deletion
    if (data === 'user_delete_cancel') {
      return bot.sendMessage(chatId, '❌ Deletion cancelled.');
    }

    // Timer deletion
    if (data.startsWith('delete_timer_')) {
      const userId = Number(data.replace('delete_timer_', ''));
      if (timerUsers.has(userId) || timerUsers.has(String(userId))) {
        timerUsers.delete(userId);
        timerUsers.delete(String(userId));

        try {
          const timerObj = Object.fromEntries(timerUsers);
          fs.writeFileSync(timerUsersFile, JSON.stringify(timerObj, null, 2));
          bot.sendMessage(chatId, `✅ Timer removed for User ID: ${userId}`);
          bot.sendMessage(userId, "❌ Your timer has been removed by an admin.");
        } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, `❌ Error removing timer: ${err.message}`);
        }
      } else {
        bot.sendMessage(chatId, "❌ This user does not have an active timer.");
      }
    }
  });
};

module.exports = {
  register
};