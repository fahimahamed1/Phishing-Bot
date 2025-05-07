const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../../connection/config.js');
let awaitingAdminInput = {};
let accessGranted = false;
let lastMessageCache = {};

// Load admin list from config
function loadAdmins() {
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);
  return config.adminChatId.split(',').map(id => id.trim());
}

// Save updated admin list to config
function saveAdmins(admins) {
  let configText = fs.readFileSync(configPath, 'utf8');
  const newAdminString = admins.join(',');
  configText = configText.replace(/adminChatId:\s*"(.*?)"/, `adminChatId: "${newAdminString}"`);
  fs.writeFileSync(configPath, configText, 'utf8');
  delete require.cache[require.resolve(configPath)];
}

// Get admin option buttons
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

// Safe message editor to avoid duplicate edits
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

// Handle admin callbacks
function handleAdmin(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const admins = loadAdmins();
  const isPrimary = chatId.toString() === admins[0];

  if (data === 'toggle_access') {
    if (!isPrimary) {
      return bot.sendMessage(chatId, '❌ Only the primary admin can toggle access.');
    }
    accessGranted = !accessGranted;
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  if (!isPrimary && !accessGranted) {
    return bot.sendMessage(chatId, '❌ Admin management is currently disabled.');
  }

  if (data === 'manage_admin') {
    return safeEditMessageText(bot, chatId, messageId, '⚙️ *Admin Management:* Choose an option:', {
      inline_keyboard: getAdminOptions()
    });
  }

  if (data === 'add_admin') {
    awaitingAdminInput[chatId] = 'add';
    return bot.sendMessage(chatId, '✏️ Please enter the *adminChatId* to add:', { parse_mode: 'Markdown' });
  }

  if (data === 'remove_admin') {
    const buttons = loadAdmins().map((id, index) => {
      return index === 0
        ? [{ text: `👑 ${id} (Primary Admin)`, callback_data: 'noop' }]
        : [{ text: `🗑️ ${id}`, callback_data: `remove_admin_${id}` }];
    });
    buttons.push([{ text: '⬅️ Back', callback_data: 'manage_admin' }]);

    return safeEditMessageText(bot, chatId, messageId, 'Select an admin to remove:', {
      inline_keyboard: buttons
    });
  }

  if (data === 'back_to_main') {
    const { adminPanelButtons } = require('../admin');
    return safeEditMessageText(bot, chatId, messageId, '🔧 *Admin Panel:* Choose an option:', {
      inline_keyboard: adminPanelButtons
    });
  }
}

// Handle admin removal callbacks
function handleRemoveCallback(callbackQuery, bot) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const idToRemove = data.replace('remove_admin_', '');
  let admins = loadAdmins();
  const isPrimary = chatId.toString() === admins[0];

  if (!isPrimary && !accessGranted) {
    return bot.sendMessage(chatId, '❌ Only the primary admin can remove admins right now.');
  }

  if (idToRemove === admins[0]) {
    return bot.sendMessage(chatId, '❌ You cannot remove the primary admin.');
  }

  if (admins.includes(idToRemove)) {
    admins = admins.filter(id => id !== idToRemove);
    saveAdmins(admins);
    bot.sendMessage(chatId, `✅ Admin ${idToRemove} removed.`);
    bot.sendMessage(idToRemove, '⚠️ You have been removed from the admin list.');
  } else {
    bot.sendMessage(chatId, '⚠️ Admin ID not found.');
  }
}

// Handle text input for adding new admins
function handleMessage(msg, bot) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (awaitingAdminInput[chatId] === 'add') {
    const admins = loadAdmins();
    if (!admins.includes(text)) {
      admins.push(text);
      saveAdmins(admins);
      bot.sendMessage(chatId, `✅ Admin ${text} added.`);
      bot.sendMessage(text, '🔔 You have been granted admin access.');
    } else {
      bot.sendMessage(chatId, `⚠️ Admin ${text} already exists.`);
    }
    delete awaitingAdminInput[chatId];
  }
}

// Register bot listeners
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
  register
};