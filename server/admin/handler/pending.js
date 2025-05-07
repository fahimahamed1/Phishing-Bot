// server/admin/handler/pending.js
const fs = require('fs');
const {
  pendingUsers,
  approvedUsers,
  pendingUsersFile,
  approvedUsersFile
} = require('../../connection/db');

// Show pending users with approval buttons
function showPendingUsers(chatId, bot) {
  if (pendingUsers.size === 0) {
    return bot.sendMessage(chatId, 'No pending users.');
  }

  const keyboard = [...pendingUsers].map((userId) => [{
    text: `Approve ${userId}`,
    callback_data: `approve_${userId}`
  }]);

  bot.sendMessage(chatId, '⏳ Pending Users:', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

// Register the button click handling for the approval logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch((err) =>
      console.error('Failed to answer callback query:', err.message)
    );

    // Button: View pending users
    if (data === 'view_pending') {
      return showPendingUsers(chatId, bot);
    }

    // Button: Approve a specific pending user
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
        bot.sendMessage(chatId, `✅ User ${userId} approved successfully.`);
      } catch (err) {
        console.error('❌ Error saving user status:', err.message);
        bot.sendMessage(chatId, '❌ Failed to approve user due to a system error.');
      }
    }
  });
}

module.exports = {
  register
};