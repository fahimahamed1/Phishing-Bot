// server/admin/src/utils/ensureBotInit.js
const { users, suspendedUsers } = require('../connection/db');
const { awaitingAdminInput, handleMessage } = require('../../handler/manageadmin');

function ensureBotInit(bot) {
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // Suspended user check
    if (suspendedUsers.has(chatId)) {
      const allowed = ['/start', '/help'];
      if (!allowed.includes(text?.toLowerCase())) {
        bot.sendMessage(chatId, '❌ You are suspended and cannot use this bot until reinstated.');
        return;
      }
    }

    // Handle admin ID input for add admin
    if (awaitingAdminInput[chatId]) {
      return handleMessage(msg, bot);
    }

    // Handle unknown commands
    const validCommands = ['/start', '/admin', '/create', '/help'];
    if (text?.startsWith('/') && !validCommands.includes(text.toLowerCase())) {
      bot.sendMessage(chatId, '🤔 Oops! I didn’t recognize that command. Try /help to see what I can do.');
      return;
    }

    // Handle unrecognized plain text
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
