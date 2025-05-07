// server/admin/handler/adduser.js
const fs = require('fs');
const {
  users,
  approvedUsers,
  approvedUsersFile
} = require('../../connection/db');

// Prompt admin to enter chat IDs
const promptForChatIds = (chatId, bot) => {
  bot.sendMessage(chatId, 'Please provide the Chat ID(s) of the user(s) you want to approve:\n\nYou can send them separated by commas, spaces, or new lines.');
  users[chatId] = { step: 'entering_chatids' };
};

// Add custom users after admin sends chat IDs
const handleAddCustomUsers = (chatId, enteredChatIds, bot) => {
  // Normalize input: replace commas and newlines with spaces
  const normalizedInput = enteredChatIds.replace(/[,|\n]/g, ' ');

  // Split by spaces and clean up
  const chatIds = normalizedInput.split(' ').map(id => id.trim()).filter(id => id.length > 0);

  const newlyApproved = [];
  const alreadyApproved = [];
  const invalidIds = [];

  for (const id of chatIds) {
    const chatIdInt = parseInt(id);

    if (isNaN(chatIdInt)) {
      invalidIds.push(id);
      continue;
    }

    if (approvedUsers.has(chatIdInt)) {
      alreadyApproved.push(chatIdInt);
      continue;
    }

    approvedUsers.add(chatIdInt);
    newlyApproved.push(chatIdInt);

    // Notify the approved user
    bot.sendMessage(chatIdInt, '✅ You have been approved and can now use the bot.');
  }

  // Save updated approved users list
  fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers], null, 2));

  // Send admin a summary
  let message = '';

  if (newlyApproved.length > 0) {
    message += `✅ Newly approved users:\n${newlyApproved.join('\n')}\n\n`;
  }
  if (alreadyApproved.length > 0) {
    message += `⚠️ Already approved users:\n${alreadyApproved.join('\n')}\n\n`;
  }
  if (invalidIds.length > 0) {
    message += `❌ Invalid IDs (not numbers):\n${invalidIds.join('\n')}`;
  }

  bot.sendMessage(chatId, message.trim());

  users[chatId].step = null; // reset step
};

// Register callback and message handler
const register = (bot) => {
  // Handle admin panel button
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data !== 'add_custom_user') return;

    bot.answerCallbackQuery(callbackQuery.id).catch(console.error);
    promptForChatIds(chatId, bot);
  });

  // Handle chat ID input
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const step = users[chatId]?.step;

    if (step === 'entering_chatids') {
      handleAddCustomUsers(chatId, msg.text, bot);
    }
  });
};

module.exports = {
  register
};
