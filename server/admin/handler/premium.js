const { approvedUsers, pendingUsers } = require('../src/connection/db');
const { isAdmin } = require('../src/utils/checkadmin');
const { safeEditMessageText } = require('../src/utils/safeEditMessageText'); // Import safeEditMessageText

let premiumMode = false;

const getPremiumMode = () => premiumMode;

// Check if a user has access when Premium Mode is on
const checkPremiumMode = (chatId, bot) => {
  console.log(`Checking Premium Mode for Chat ID: ${chatId}`);
  
  if (premiumMode && !approvedUsers.has(chatId) && !isAdmin(chatId)) {
    bot.sendMessage(chatId, '❌ Premium mode is enabled. You need admin approval to use this bot.');
    return false;
  }

  return true;
};

// Toggle Premium Mode and notify users only if necessary
const togglePremiumMode = (chatId, bot) => {
  premiumMode = !premiumMode;

  // Notify pending users if Premium Mode is ON
  if (premiumMode) {
    notifyPendingUsers(bot);
  }
};

// Notify pending users when Premium Mode is ON
const notifyPendingUsers = (bot) => {
  pendingUsers.forEach(userId => {
    if (!approvedUsers.has(userId)) {
      bot.sendMessage(userId, '❌ Premium mode is ON. You need admin approval to use the bot.');
    }
  });
};

// Create the button to toggle Premium Mode
const createPremiumButton = () => ({
  text: `Premium: ${premiumMode ? 'ON' : 'OFF'}`,
  callback_data: 'toggle_premium_mode',
});

// Create the Back to Admin Panel button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Display the Premium Mode toggle button with Back to Admin Panel button
const showPremiumToggleButton = (chatId, bot, messageId) => {
  const messageText = `Click below to toggle Premium Mode: ${premiumMode ? 'ON' : 'OFF'}`;
  const replyMarkup = {
    inline_keyboard: [
      [createPremiumButton()],
      [createBackButton()],
    ],
  };

  safeEditMessageText(bot, chatId, messageId, messageText, replyMarkup);
};

// Handle callback query and update premium mode status
const handleCallbackQuery = (query, bot) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const { data } = query;

  if (data === 'premium_list' && isAdmin(chatId)) {
    showPremiumToggleButton(chatId, bot, messageId);
  }

  // Toggle Premium Mode when button is pressed
  if (data === 'toggle_premium_mode' && isAdmin(chatId)) {
    togglePremiumMode(chatId, bot);

    // Update button text after toggle
    const messageText = `Click below to toggle Premium Mode: ${premiumMode ? 'ON' : 'OFF'}`;
    const replyMarkup = {
      inline_keyboard: [
        [createPremiumButton()],
        [createBackButton()],
      ],
    };

    safeEditMessageText(bot, chatId, messageId, messageText, replyMarkup);
  }

  // Handle "Back to Admin Panel" button press
  if (data === 'back_to_admin_panel' && isAdmin(chatId)) {
    const { adminPanelButtons } = require('../admin'); // Assuming admin panel buttons are in this file
    safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
      inline_keyboard: adminPanelButtons,
    });
  }
};

// Register the actions for the Premium toggle button in the admin panel
const register = (bot) => {
  bot.on('callback_query', (query) => {
    handleCallbackQuery(query, bot);
  });
};

module.exports = {
  checkPremiumMode,
  getPremiumMode,
  register,
};
