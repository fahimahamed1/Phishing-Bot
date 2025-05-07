// server/admin/handler/deletepage.js
const fs = require('fs');
const path = require('path');
const { bot } = require('../../serverSetup');

// Function to trigger the delete page process
function deletePage(chatId) {
  const viewsFolderPath = path.join(__dirname, '../../views');
  
  // Read files in the views folder
  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      console.error(err);
      return bot.sendMessage(chatId, '❌ Error reading the folder.');
    }

    // Filter for .ejs files and extract their base names
    const fileNames = files
      .filter(file => path.extname(file) === '.ejs')
      .map(file => path.basename(file, '.ejs'));

    // If no .ejs files are found, send a message
    if (fileNames.length === 0) {
      return bot.sendMessage(chatId, '❌ No .ejs files found in the /views folder.');
    }

    // Create inline keyboard with the list of file names
    const keyboard = fileNames.map(fileName => [
      { text: fileName, callback_data: `ask_delete_${fileName}` }
    ]);

    bot.sendMessage(chatId, '🗑 Please select a file to delete:', {
      reply_markup: { inline_keyboard: keyboard }
    });
  });
}

// Callback query handler to process delete actions
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Step 1: User clicks file to delete
  if (data.startsWith('ask_delete_')) {
    const fileName = data.replace('ask_delete_', '');
    const confirmKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Yes, delete it', callback_data: `confirm_delete_${fileName}` },
          { text: '❌ Cancel', callback_data: `cancel_delete` }
        ]
      ]
    };
    return bot.sendMessage(chatId, `⚠️ Are you sure you want to delete "${fileName}.ejs"?`, {
      reply_markup: confirmKeyboard
    });
  }

  // Step 2: User confirms deletion
  if (data.startsWith('confirm_delete_')) {
    const fileNameToDelete = data.replace('confirm_delete_', '');
    const filePath = path.join(__dirname, '../../views', `${fileNameToDelete}.ejs`);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return bot.sendMessage(chatId, `❌ Error deleting the file: ${err.message}`);
      }
      bot.sendMessage(chatId, `✅ Page "${fileNameToDelete}" has been successfully deleted.`);
    });
  }

  // Step 3: User cancels deletion
  if (data === 'cancel_delete') {
    bot.sendMessage(chatId, '❎ Deletion canceled.');
  }
});

// Register function for use in admin panel (to trigger deletePage when needed)
function register(bot) {
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Trigger the deletePage function when the delete page button is clicked
    if (data === 'delete_page') {
      deletePage(chatId);
    }
  });
}

module.exports = {
  deletePage,
  register
};