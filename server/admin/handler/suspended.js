// server/admin/handler/suspended.js
const fs = require('fs');
const {
  approvedUsers,
  suspendedUsers,
  approvedUsersFile,
  suspendedUsersFile
} = require('../../connection/db');

// Show list of suspended users
function showSuspendedUsers(chatId, bot) {
  if (suspendedUsers.size === 0) {
    return bot.sendMessage(chatId, '✅ No suspended users.');
  }

  const keyboard = [...suspendedUsers].map((userId) => [{
    text: `Approve ${userId}`,
    callback_data: `approve_suspended_${userId}`
  }]);

  bot.sendMessage(chatId, '⏳ Suspended Users:', {
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

    // View suspended users
    if (data === 'view_suspended') {
      return showSuspendedUsers(chatId, bot);
    }

    // Approve suspended user
    if (data.startsWith('approve_suspended_')) {
      const userId = parseInt(data.replace('approve_suspended_', ''));
      if (isNaN(userId)) return;

      if (!suspendedUsers.has(userId)) {
        return bot.sendMessage(chatId, '❌ This user is not in the suspended list.');
      }

      suspendedUsers.delete(userId);
      approvedUsers.add(userId);

      fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));
      fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));

      bot.sendMessage(userId, '✅ You have been approved! You can now use the bot.');
      bot.sendMessage(chatId, `✅ User ${userId} has been approved.`);
    }
  });
}

module.exports = {
  register
};