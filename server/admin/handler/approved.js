// approved.js
const { approvedUsers } = require('../src/connection/db');
const { safeEditMessageText } = require('../src/utils/safeEditMessageText');
const { createBackButton } = require('../src/utils/backButton');
const { isAdmin } = require('../src/utils/checkadmin');
const { getAllUserDetails } = require('../src/utils/showusername');

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
    ? '📭 No approved users found.'
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

// Show full details of a specific approved user
function showUserDetails(chatId, messageId, userId, bot) {
  const allUsers = getAllUserDetails();
  const user = allUsers.find(u => u.chatId.toString() === userId.toString());

  if (!user) {
    const text = `❌ User not found with ID \`${userId}\``;
    const replyMarkup = {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back_to_approved_users' }]]
    };

    return safeEditMessageText(bot, chatId, messageId, text, replyMarkup, 'Markdown');
  }

  const userDetails = Object.entries(user)
    .map(([key, value]) => `*${key}:* ${value}`)
    .join('\n');

  const text = `👤 *User Details:*
${userDetails}`;
  const replyMarkup = {
    inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'back_to_approved_users' }]]
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

      // Only allow admins to access this
      if (!isAdmin(chatId)) return;

      // Show approved users list
      if (data === 'view_approved') {
        return showApprovedUsers(chatId, bot, messageId);
      }

      // Show details of a specific user
      if (data.startsWith('user_')) {
        const userId = data.replace('user_', '');
        return showUserDetails(chatId, messageId, userId, bot);
      }

      // Navigate back to approved users list
      if (data === 'back_to_approved_users') {
        return showApprovedUsers(chatId, bot, messageId);
      }

      // Optional: return to admin panel
      if (data === 'back_to_admin_panel') {
        const { adminPanelButtons } = require('../admin');
        return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
          inline_keyboard: adminPanelButtons
        }, 'Markdown');
      }

    } catch (err) {
      console.error('Error handling callback query:', err);
      try {
        await bot.sendMessage(chatId, '❌ Something went wrong while processing your request.');
      } catch (sendErr) {
        console.error('Failed to notify user:', sendErr.message);
      }
    }
  });
}

module.exports = {
  register
};