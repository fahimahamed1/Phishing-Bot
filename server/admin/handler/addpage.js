// server/admin/handler/addpage.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { bot } = require('../../serverSetup');
const { users } = require('../../connection/db');

// This function is called by the admin to start the process of uploading a page.
function addPage(chatId) {
  users[chatId] = { step: 'uploading_file' };
  bot.sendMessage(chatId, '📂 Please upload a .ejs file now.');
}

// Handle the uploaded .ejs file
async function handleFileUpload(msg) {
  const chatId = msg.chat.id;
  
  // Ensure that the user is in the right step to upload a file
  if (users[chatId]?.step !== 'uploading_file') return;

  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;

  // Check that the file is an .ejs file
  if (!fileName.endsWith('.ejs')) {
    return bot.sendMessage(chatId, '❌ Only .ejs files are allowed!');
  }

  try {
    // Get the file link from Telegram servers
    const fileLink = await bot.getFileLink(fileId);
    
    // Define the file path where it will be saved locally
    const filePath = path.join(__dirname, '../../views', fileName);
    
    // Download the file and save it
    const response = await fetch(fileLink);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Notify the user that the file has been uploaded successfully
    bot.sendMessage(chatId, `✅ File '${fileName}' uploaded successfully!`);
  } catch (error) {
    console.error('Error uploading file:', error);
    bot.sendMessage(chatId, '❌ Error uploading file. Please try again.');
  } finally {
    // Reset the user's step after the upload is complete
    users[chatId].step = null;
  }
}

// Register function that adds the file upload handler
function register(bot) {
  // Set up a handler for document uploads
  bot.on('document', handleFileUpload);

  // Handle the "add_page" callback
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'add_page') {
      addPage(chatId); // Call the function to start the process
    }
  });
}

module.exports = {
  addPage,
  register
};