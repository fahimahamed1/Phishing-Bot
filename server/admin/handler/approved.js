const { approvedUsers } = require('../../connection/db');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { createBackButton } = require('../../utils/backButton');
const { isAdmin } = require('../../utils/checkadmin');
const { getAllUserDetails } = require('../../utils/showusername');

// Generate inline keyboard for approved users (3 per row)
function generateApprovedUserKeyboard() {
  const keyboard = [];
  let row = [];

  [...approvedUsers].forEach((userId, index) => {
    row.push({
      text: `User ${userId}`,
      callback_data: `user_${userId}`
    });

    if (row.length === 3 || index === approvedUsers.size - 1) {
      keyboard.push(row);
      row = [];
    }
  });

  keyboard.push([createBackButton()]);
  return keyboard;
}

// Show the list of approved users
function showApprovedUsers(chatId, bot, messageId = null) {
  const text = approvedUsers.size === 0
    ? 'No approved users.'
    : '✅ *Approved Users:*';

  const replyMarkup = {
    inline_keyboard: approvedUsers.size === 0
      ? [[createBackButton()]]
      : generateApprovedUserKeyboard()
  };

  if (messageId) {
    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  } else {
    return bot.sendMessage(chatId, text, {
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
  }
}

// Show a user's full details, replacing the previous message
function showUserDetails(chatId, messageId, userId, bot) {
  const allUsers = getAllUserDetails();
  const user = allUsers.find(u => u.chatId === userId);

  if (!user) {
    const text = `User not found with ID ${userId}`;
    const replyMarkup = {
      inline_keyboard: [
        [{
          text: '⬅️ Back',
          callback_data: 'back_to_approved_users'
        }]
      ]
    };

    // Using safeEditMessageText to replace the current message with an error message
    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  }

  const userDetails = Object.entries(user)
    .map(([key, value]) => `*${key}:* ${value}`)
    .join('\n');

  const text = `*User Details:*\n${userDetails}`;
  const replyMarkup = {
    inline_keyboard: [
      [{
        text: '⬅️ Back',
        callback_data: 'back_to_approved_users'
      }]
    ]
  };

  return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
}

// Register callback query handling
function register(bot) {
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    try {
      await bot.answerCallbackQuery(callbackQuery.id);

      if (!isAdmin(chatId)) return;

      // View approved users list
      if (data === 'view_approved') {
        return showApprovedUsers(chatId, bot, messageId);
      }

      // Show details for a selected user
      if (data.startsWith('user_')) {
        const userId = parseInt(data.replace('user_', ''));
        if (!isNaN(userId)) {
          return showUserDetails(chatId, messageId, userId, bot);
        }
      }

      // Back to approved users list
      if (data === 'back_to_approved_users') {
        return showApprovedUsers(chatId, bot, messageId);
      }

      // Optional: back to admin panel
      if (data === 'back_to_admin_panel') {
        const { adminPanelButtons } = require('../admin');
        return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
          inline_keyboard: adminPanelButtons,
          parse_mode: 'Markdown'
        });
      }

    } catch (err) {
      console.error('Error handling callback query:', err.message);
      bot.sendMessage(chatId, '❌ Something went wrong while processing your request.');
    }
  });
}

module.exports = {
  register
};
