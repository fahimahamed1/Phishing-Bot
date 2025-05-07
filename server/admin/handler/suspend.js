// server/admin/handler/suspend.js
const fs = require('fs');
const {
  approvedUsers,
  suspendedUsers,
  approvedUsersFile,
  suspendedUsersFile
} = require('../../connection/db');

// Show list of approved users to suspend
function showSuspendOptions(chatId, bot) {
  if (approvedUsers.size === 0) {
    return bot.sendMessage(chatId, 'No approved users to suspend.');
  }

  const keyboard = [...approvedUsers].map((userId) => [{
    text: `Suspend ${userId}`,
    callback_data: `suspend_${userId}`
  }]);

  bot.sendMessage(chatId, '⏳ Select a user to suspend:', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

// Register callback logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(err =>
      console.error('Failed to answer callback query:', err.message)
    );

    // View suspend options
    if (data === 'suspend_user') {
      return showSuspendOptions(chatId, bot);
    }

    // Suspend a user
    if (data.startsWith('suspend_')) {
      const userId = parseInt(data.replace('suspend_', ''));
      if (isNaN(userId)) return;

      if (!approvedUsers.has(userId)) {
        return bot.sendMessage(chatId, '⚠️ User is not in the approved list.');
      }

      approvedUsers.delete(userId);
      suspendedUsers.add(userId);

      fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
      fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));

      bot.sendMessage(userId, '❌ You have been suspended and can no longer use the bot.');
      bot.sendMessage(chatId, `✅ User ${userId} suspended.`);
    }
  });
}

module.exports = {
  register
};