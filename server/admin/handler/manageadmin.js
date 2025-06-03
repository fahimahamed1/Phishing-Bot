const path = require('path');
const { getAdmins, isAdmin } = require('../src/utils/checkadmin');
const { addAdmin, removeAdmin } = require('../src/utils/adminmanage');

let awaitingAdminInput = {}; // Track waiting users
let accessGranted = false; // Admin access flag
let lastMessageCache = {}; // Cache for message edits

// Get admin options for the panel
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

// Edit message text if it changes
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

// Handle admin removal callback
async function handleRemoveCallback(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const idToRemove = callbackQuery.data.replace('remove_admin_', '');
  const admins = getAdmins();
  const isPrimary = chatId.toString() === admins[0];

  if (!isPrimary && !accessGranted) {
    return bot.sendMessage(chatId, '❌ Only the primary admin can remove admins.');
  }
  if (idToRemove === admins[0]) {
    return bot.sendMessage(chatId, '❌ Cannot remove the primary admin.');
  }
  if (!admins.includes(idToRemove)) {
    return bot.sendMessage(chatId, '⚠️ Admin ID not found.');
  }

  const success = removeAdmin(idToRemove);
  if (success) {
    await bot.answerCallbackQuery(callbackQuery.id, { text: `✅ Admin ${idToRemove} removed.`, show_alert: false });
    bot.sendMessage(idToRemove, '⚠️ You have been removed from the admin list.').catch(() => {});
  }

  const updatedAdmins = getAdmins();
  const buttons = updatedAdmins.length > 0
    ? updatedAdmins.map((id, index) => {
        return index === 0
          ? [{ text: `👑 ${id} (Primary Admin)`, callback_data: 'noop' }]
          : [{ text: `🗑️ ${id}`, callback_data: `remove_admin_${id}` }];
      })
    : [[{ text: 'No other admins available', callback_data: 'noop' }]];

  buttons.push([{ text: '⬅️ Back', callback_data: 'manage_admin' }]);
  safeEditMessageText(bot, chatId, messageId, 'Select an admin to remove:', { inline_keyboard: buttons });
}

// Handle admin panel callbacks
function handleAdmin(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const admins = getAdmins();
  const isPrimary = chatId.toString() === admins[0];
  const isUserAdmin = admins.includes(chatId.toString());

  // Block all non-admin users from using admin panel buttons
  if (!isUserAdmin) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ You are not an admin.', show_alert: true });
  }

  if (data === 'toggle_access') {
    if (!isPrimary) return bot.sendMessage(chatId, '❌ Only the primary admin can toggle access.');
    accessGranted = !accessGranted;
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  if (!isPrimary && !accessGranted) return bot.sendMessage(chatId, '❌ Admin management is disabled.');

  if (data === 'manage_admin') {
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  if (data === 'add_admin') {
    awaitingAdminInput[chatId] = 'add';
    return bot.sendMessage(chatId, '✏️ Enter *adminChatId* to add:', { parse_mode: 'Markdown' });
  }

  if (data === 'remove_admin') {
    const buttons = admins.map((id, index) => {
      return index === 0
        ? [{ text: `👑 ${id} (Primary Admin)`, callback_data: 'noop' }]
        : [{ text: `🗑️ ${id}`, callback_data: `remove_admin_${id}` }];
    });
    buttons.push([{ text: '⬅️ Back', callback_data: 'manage_admin' }]);
    return safeEditMessageText(bot, chatId, messageId, 'Select an admin to remove:', { inline_keyboard: buttons });
  }

  if (data === 'back_to_main') {
    const { adminPanelButtons } = require('../admin');
    return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', { inline_keyboard: adminPanelButtons });
  }
}

// Handle message-based admin input
function handleMessage(msg, bot) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (awaitingAdminInput[chatId] === 'add') {
    const success = addAdmin(text);
    if (success) {
      bot.sendMessage(chatId, `✅ Admin ${text} added.`);
      bot.sendMessage(text, '🔔 You have been granted admin access.').catch(() => {});
    } else {
      bot.sendMessage(chatId, `⚠️ Admin ${text} already exists.`);
    }
    delete awaitingAdminInput[chatId];
  }
}

// Register bot listeners
function register(bot) {
  bot.on('callback_query', (query) => {
    if (query.data.startsWith('remove_admin_')) {
      handleRemoveCallback(query, bot);
    } else {
      handleAdmin(query, bot);
    }
  });

  bot.on('message', (msg) => {
    handleMessage(msg, bot);
  });
}

module.exports = { register };
