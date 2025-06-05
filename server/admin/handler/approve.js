// server/admin/handler/approve.js
const { approvedUsers } = require('../../connection/db');

// Show approved users as plain text list
function showApprovedUsers(chatId, bot) {
  if (approvedUsers.size === 0) {
    return bot.sendMessage(chatId, 'No approved users.');
  }

  const userList = [...approvedUsers].join('\n');
  bot.sendMessage(chatId, `✅ Approved Users:\n${userList}`);
}

// Register the button click handling for the approved users logic
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Button: View approved users
    if (data === 'view_approved') {
      return showApprovedUsers(chatId, bot);
    }
  });
}

module.exports = {
  register
};