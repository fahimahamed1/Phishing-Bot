// server/admin/handler/suspension.js
const fs = require('fs');
const {
  approvedUsers,
  suspendedUsers,
  approvedUsersFile,
  suspendedUsersFile
} = require('../../connection/db');

// Show list of approved users to suspend
function suspendUser(chatId, bot) {
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

// Show list of suspended users to re-approve
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

// Register callback handler
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id).catch(err =>
      console.error('Failed to answer callback query:', err.message)
    );

    // Handle suspend action
    if (data === 'suspend_user') {
      return suspendUser(chatId, bot);
    }

    // Handle viewing suspended users
    if (data === 'view_suspended') {
      return showSuspendedUsers(chatId, bot);
    }

    // Handle actual suspension
    if (data.startsWith('suspend_')) {
      const userId = parseInt(data.replace('suspend_', ''));
      if (isNaN(userId)) return;

      approvedUsers.delete(userId);
      suspendedUsers.add(userId);
      fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
      fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));

      bot.sendMessage(userId, '❌ You have been suspended and can no longer use the bot.');
      bot.sendMessage(chatId, `✅ User ${userId} suspended.`);
    }

    // Handle re-approving suspended user
    if (data.startsWith('approve_suspended_')) {
      const userId = parseInt(data.replace('approve_suspended_', ''));
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