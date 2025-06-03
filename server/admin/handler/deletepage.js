const fs = require('fs');
const path = require('path');

// Trigger the delete page process
function deletePage(bot, chatId) {
  const viewsFolderPath = path.join(__dirname, '../../views');

  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      console.error(err);
      return bot.sendMessage(chatId, '❌ Error reading the folder.');
    }

    const fileNames = files
      .filter(file => path.extname(file) === '.ejs')
      .map(file => path.basename(file, '.ejs'));

    if (fileNames.length === 0) {
      return bot.sendMessage(chatId, '❌ No .ejs files found in the /views folder.');
    }

    const keyboard = fileNames.map(fileName => [
      { text: fileName, callback_data: `ask_delete_${fileName}` }
    ]);

    bot.sendMessage(chatId, '🗑 Please select a file to delete:', {
      reply_markup: { inline_keyboard: keyboard }
    });
  });
}

// Register handlers for deletion logic
function register(bot) {
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Show list of deletable pages
    if (data === 'delete_page') {
      return deletePage(bot, chatId);
    }

    // Step 1: Ask for confirmation
    if (data.startsWith('ask_delete_')) {
      const fileName = data.replace('ask_delete_', '');
      const confirmKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yes, delete it', callback_data: `confirm_delete_${fileName}` },
            { text: '❌ Cancel', callback_data: 'cancel_delete' }
          ]
        ]
      };
      return bot.sendMessage(chatId, `⚠️ Are you sure you want to delete "${fileName}.ejs"?`, {
        reply_markup: confirmKeyboard
      });
    }

    // Step 2: Confirm deletion
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

    // Step 3: Cancel deletion
    if (data === 'cancel_delete') {
      bot.sendMessage(chatId, '❎ Deletion canceled.');
    }
  });
}

module.exports = {
  deletePage,
  register
};
