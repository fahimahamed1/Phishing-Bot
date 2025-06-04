const { approvedUsers, pendingUsers } = require('../src/connection/db');
const { isAdmin } = require('../src/utils/checkadmin');
const { safeEditMessageText } = require('../src/utils/safeEditMessageText');

const PREMIUM_MODE_WARNING = '❌ Premium mode is enabled. You need admin approval to use this bot.';

let premiumMode = false;

// Get current premium mode status
const getPremiumMode = () => premiumMode;

// Check if user is allowed during premium mode
const checkPremiumMode = (chatId, bot) => {
    
  if (premiumMode && !approvedUsers.has(chatId) && !isAdmin(chatId)) {
    bot.sendMessage(chatId, PREMIUM_MODE_WARNING);
    return false;
  }

  return true;
};

// Toggle premium mode and notify pending users if turned ON
const togglePremiumMode = (chatId, bot) => {
  premiumMode = !premiumMode;

  if (premiumMode) {
    notifyPendingUsers(bot);
  }
};

// Notify unapproved users about premium mode restriction
const notifyPendingUsers = (bot) => {
  pendingUsers.forEach(userId => {
    if (!approvedUsers.has(userId)) {
      bot.sendMessage(userId, PREMIUM_MODE_WARNING);
    }
  });
};

// Create premium toggle button
const createPremiumButton = () => ({
  text: `Premium: ${premiumMode ? 'ON' : 'OFF'}`,
  callback_data: 'toggle_premium_mode',
});

// Create back button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

// Generate UI for premium toggle panel
const getPremiumToggleUI = () => {
  const messageText = `Click below to toggle Premium Mode: ${premiumMode ? 'ON' : 'OFF'}`;
  const replyMarkup = {
    inline_keyboard: [
      [createPremiumButton()],
      [createBackButton()],
    ],
  };
  return { messageText, replyMarkup };
};

// Show premium toggle UI
const showPremiumToggleButton = (chatId, bot, messageId) => {
  const { messageText, replyMarkup } = getPremiumToggleUI();
  safeEditMessageText(bot, chatId, messageId, messageText, replyMarkup);
};

// Handle button callbacks
const handleCallbackQuery = (query, bot) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const { data } = query;

  if (data === 'premium_list' && isAdmin(chatId)) {
    showPremiumToggleButton(chatId, bot, messageId);
  }

  if (data === 'toggle_premium_mode' && isAdmin(chatId)) {
    togglePremiumMode(chatId, bot);

    const { messageText, replyMarkup } = getPremiumToggleUI();
    safeEditMessageText(bot, chatId, messageId, messageText, replyMarkup);
  }

  if (data === 'back_to_admin_panel' && isAdmin(chatId)) {
    const { adminPanelButtons } = require('../admin');
    safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
      inline_keyboard: adminPanelButtons,
    });
  }
};

// Register callback handler
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
