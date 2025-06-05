const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { users } = require('../../connection/db');
const { isAdmin } = require('../../utils/checkAdmin');

// Start the process of uploading a page
function addPage(bot, chatId) {
  if (!isAdmin(chatId)) {
    return; // silently ignore non-admins
  }

  users[chatId] = { step: 'uploading_file' };
  bot.sendMessage(chatId, '📂 Please upload a .ejs file now.');
}

// Handle the uploaded .ejs file
async function handleFileUpload(bot, msg) {
  const chatId = msg.chat.id;

  if (!isAdmin(chatId)) {
    return; // silently ignore non-admins
  }

  if (users[chatId]?.step !== 'uploading_file') return;

  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;

  if (!fileName.endsWith('.ejs')) {
    return bot.sendMessage(chatId, '❌ Only .ejs files are allowed!');
  }

  try {
    const fileLink = await bot.getFileLink(fileId);
    const filePath = path.join(__dirname, '../../views', fileName);

    const response = await fetch(fileLink);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    bot.sendMessage(chatId, `✅ File '${fileName}' uploaded successfully!`);
  } catch (error) {
    console.error('Error uploading file:', error);
    bot.sendMessage(chatId, '❌ Error uploading file. Please try again.');
  } finally {
    users[chatId].step = null;
  }
}

// Register listeners
function register(bot) {
  bot.on('document', (msg) => handleFileUpload(bot, msg));

  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'add_page') {
      addPage(bot, chatId);
    }
  });
}

module.exports = {
  addPage,
  register
};
