const { getAdmins, isAdmin } = require('../../utils/checkAdmin');
const { addAdmin, removeAdmin } = require('../../utils/adminModify');

const UNAUTHORIZED_MSG = '❌ You are not authorized to use or have no longer access.';

let awaitingAdminInput = {}; // Tracks chatIds waiting for admin input
let accessGranted = false;   // Flag to allow non-primary admin access
let lastMessageCache = {};   // Stores last messages to avoid redundant edits

// Inline buttons for the admin panel
function getAdminOptions() {
  return [
    [
      { text: '➕ Add Admin', callback_data: 'add_admin' },
      { text: '➖ Remove Admin', callback_data: 'remove_admin' }
    ],
    [
      { text: `Give Access: ${accessGranted ? 'ON' : 'OFF'}`, callback_data: 'toggle_access' }
    ],
    [
      { text: '⬅️ Back to Admin Panel', callback_data: 'back_to_main' }
    ]
  ];
}

// Edit message only if content/markup has changed
function safeEditMessageText(bot, chatId, messageId, newText, replyMarkup) {
  const key = `${chatId}_${messageId}`;
  const currentCache = lastMessageCache[key] || {};
  const newMarkup = JSON.stringify(replyMarkup?.inline_keyboard || []);

  if (currentCache.text !== newText || currentCache.markup !== newMarkup) {
    bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
    lastMessageCache[key] = { text: newText, markup: newMarkup };
  }
}

// Handle callback for removing a specific admin
async function handleRemoveCallback(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const idToRemove = data.replace('remove_admin_', '');
  const admins = getAdmins();
  const isPrimary = chatId.toString() === admins[0];

  if (!isAdmin(chatId.toString())) {
    return bot.sendMessage(chatId, UNAUTHORIZED_MSG);
    }

  if (!isPrimary && !accessGranted)
    return bot.sendMessage(chatId, '❌ Only the primary admin can remove admins.');
  if (idToRemove === admins[0])
    return bot.sendMessage(chatId, '❌ Cannot remove the primary admin.');
  if (!admins.includes(idToRemove))
    return bot.sendMessage(chatId, '⚠️ Admin ID not found.');

  removeAdmin(idToRemove);

  await bot.answerCallbackQuery(callbackQuery.id, { text: `✅ Admin ${idToRemove} removed.`, show_alert: false });
  bot.sendMessage(idToRemove, '⚠️ You have been removed from the admin list.').catch(() => {});

  const updatedAdmins = getAdmins();
  const buttons = updatedAdmins.map((id, index) => {
    return index === 0
      ? [{ text: `👑 ${id} (Primary Admin)`, callback_data: 'noop' }]
      : [{ text: `🗑️ ${id}`, callback_data: `remove_admin_${id}` }];
  });

  buttons.push([{ text: '⬅️ Back', callback_data: 'manage_admin' }]);
  safeEditMessageText(bot, chatId, messageId, 'Select an admin to remove:', { inline_keyboard: buttons });
}

// Handles admin-related callback actions
function handleAdmin(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const admins = getAdmins();
  const isPrimary = chatId.toString() === admins[0];
  const restrictedActions = ['manage_admin', 'add_admin', 'remove_admin', 'toggle_access'];

  // Block restricted actions for non-admins
  if (restrictedActions.includes(data) && !isAdmin(chatId.toString())) {
    return bot.sendMessage(chatId, UNAUTHORIZED_MSG);
  }

  // Restrict non-primary admins if access not granted
  if (restrictedActions.includes(data) && !isPrimary && !accessGranted) {
    return bot.sendMessage(chatId, '❌ Admin management is disabled.');
  }

  // Toggle access
  if (data === 'toggle_access') {
    accessGranted = !accessGranted;
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  // Show admin management panel
  if (data === 'manage_admin') {
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  // Begin process to add new admin
  if (data === 'add_admin') {
    awaitingAdminInput[chatId] = 'add';
    return bot.sendMessage(chatId, '✏️ Enter *adminChatId* to add:', { parse_mode: 'Markdown' });
  }

  // Show list of admins to remove
  if (data === 'remove_admin') {
    const buttons = admins.map((id, index) => {
      return index === 0
        ? [{ text: `👑 ${id} (Primary Admin)`, callback_data: 'noop' }]
        : [{ text: `🗑️ ${id}`, callback_data: `remove_admin_${id}` }];
    });
    buttons.push([{ text: '⬅️ Back', callback_data: 'manage_admin' }]);
    return safeEditMessageText(bot, chatId, messageId, 'Select an admin to remove:', {
      inline_keyboard: buttons
    });
  }

  // Navigate back to main admin panel
  if (data === 'back_to_main') {
    const { adminPanelButtons } = require('../admin');
    return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
      inline_keyboard: adminPanelButtons
    });
  }
}

// Handles text messages from users (e.g., new admin ID input)
function handleMessage(msg, bot) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (awaitingAdminInput[chatId] === 'add') {
    if (!isAdmin(chatId.toString())) {
      return bot.sendMessage(chatId, UNAUTHORIZED_MSG);
    }

    const added = addAdmin(text);
    if (added) {
      bot.sendMessage(chatId, `✅ Admin ${text} added.`);
      bot.sendMessage(text, '🔔 You have been granted admin access.').catch(() => {});
    } else {
      bot.sendMessage(chatId, `⚠️ Admin ${text} already exists.`);
    }
    delete awaitingAdminInput[chatId];
  }
}

// Register bot event listeners
function register(bot) {
  bot.on('callback_query', (query) => {
    const data = query.data;
    if (data.startsWith('remove_admin_')) {
      handleRemoveCallback(query, bot);
    } else {
      handleAdmin(query, bot);
    }
  });

  bot.on('message', (msg) => {
    handleMessage(msg, bot);
  });
}

module.exports = {
  register,
  awaitingAdminInput,
  handleMessage
};
