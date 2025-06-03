// server/admin/src/utils/ensureBotInit.js
const { users } = require('../connection/db'); // Adjust path if needed

function ensureBotInit(bot) {
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // Define valid commands
    const validCommands = ['/start', '/admin', '/create', '/help'];

    // Handle unknown commands
    if (text?.startsWith('/') && !validCommands.includes(text.toLowerCase())) {
      bot.sendMessage(chatId, '🤔 Oops! I didn’t recognize that command. Try /help to see what I can do.');
      return;
    }

    // Handle unrecognized plain text messages
    const validSteps = [
      'selecting_file',
      'uploading_file',
      'waiting_for_url',
      'entering_chatids',
      'entering_timer',
      'broadcast_select_user',
      'broadcast_msg_specific',
      'broadcast_msg_all'
    ];

    const currentStep = users[chatId]?.step;

    if (!text?.startsWith('/') && !validSteps.includes(currentStep)) {
      bot.sendMessage(chatId, '💬 Not sure what to do? Use /help to explore available options.');
    }
  });
}

module.exports = { ensureBotInit };
