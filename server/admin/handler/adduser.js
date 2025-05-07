// server/admin/handler/adduser.js
const fs = require('fs');
const {
  users,
  approvedUsers,
  approvedUsersFile
} = require('../../connection/db');

// Prompt admin to enter chat ID
const promptForChatId = (chatId, bot) => {
  bot.sendMessage(chatId, 'Please provide the Chat ID of the user you want to approve:');
  users[chatId] = { step: 'entering_chatid' };
};

// Add custom user after admin sends chat ID
const handleAddCustomUser = (chatId, enteredChatId, bot) => {
  const chatIdInt = parseInt(enteredChatId);

  if (isNaN(chatIdInt)) {
    return bot.sendMessage(chatId, '❌ Invalid Chat ID. Please enter a valid number.');
  }

  if (approvedUsers.has(chatIdInt)) {
    return bot.sendMessage(chatId, '❌ This user is already approved.');
  }

  approvedUsers.add(chatIdInt);
  fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers], null, 2));

  bot.sendMessage(chatId, `✅ User with Chat ID ${chatIdInt} has been added to approved users.`);
  bot.sendMessage(chatIdInt, '✅ You have been approved and can now use the bot.');

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
    promptForChatId(chatId, bot);
  });

  // Handle chat ID input
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const step = users[chatId]?.step;

    if (step === 'entering_chatid') {
      handleAddCustomUser(chatId, msg.text, bot);
    }
  });
};

module.exports = {
  register
};