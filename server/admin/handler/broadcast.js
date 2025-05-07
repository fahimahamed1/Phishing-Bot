const { approvedUsers, pendingUsers, suspendedUsers, users } = require('../../connection/db');
const { isAdmin } = require('../../utils/checkadmin');
const { getUserName } = require('../../utils/showusername');
const { safeEditMessageText } = require('../../utils/safeEditMessageText');
const { createBackButton } = require('../../utils/backButton');

const STATES = {
  SELECT_USER: 'broadcast_select_user',
  MESSAGE_FOR_SPECIFIC: 'broadcast_msg_specific',
  MESSAGE_FOR_ALL: 'broadcast_msg_all'
};

// Buttons
const createBackToBroadcastMenuButton = () => ({
  text: '⬅️ Back to Broadcast Menu', callback_data: 'back_to_broadcast_menu'
});

// Broadcast Menu
const getBroadcastMenuOptions = () => ({
  inline_keyboard: [
    [
      { text: '📤 Specific User', callback_data: 'broadcast_specific' },
      { text: '📢 All Users', callback_data: 'broadcast_all' }
    ],
    [createBackButton()]
  ]
});

function register(bot) {
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (!isAdmin(chatId)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Access Denied',
        show_alert: true
      });
    }

    await bot.answerCallbackQuery(callbackQuery.id).catch(console.error);

    // Stop any active broadcast session when going back
    if (data === 'broadcast' || data === 'back_to_broadcast_menu') {
      users[chatId] = null; // << CLEAR the user session

      return safeEditMessageText(
        bot, chatId, messageId,
        '📢 *Please choose how to broadcast your message:*',
        getBroadcastMenuOptions(),
        'Markdown'
      );
    }

    if (data === 'back_to_admin_panel') {
      users[chatId] = null; // << CLEAR the user session

      const { adminPanelButtons } = require('../admin');
      return safeEditMessageText(
        bot, chatId, messageId,
        '🔧 *Admin Panel:* Choose an option:',
        { inline_keyboard: adminPanelButtons },
        'Markdown'
      );
    }

    if (data === 'broadcast_specific') {
      const userList = [...approvedUsers, ...pendingUsers, ...suspendedUsers];

      if (userList.length === 0) {
        return safeEditMessageText(
          bot, chatId, messageId,
          '❌ No users available for selection.',
          { inline_keyboard: [[createBackToBroadcastMenuButton()]] },
          'Markdown'
        );
      }

      let userListText = '*Select a user to send a message:*\n\n';
      userList.forEach((id, index) => {
        const name = getUserName(id);
        userListText += `${index + 1}. ${name} (ID: ${id})\n`;
      });

      users[chatId] = { step: STATES.SELECT_USER, list: userList };

      return safeEditMessageText(
        bot, chatId, messageId,
        userListText,
        { inline_keyboard: [[createBackToBroadcastMenuButton()]] },
        'Markdown'
      );
    }

    if (data === 'broadcast_all') {
      users[chatId] = { step: STATES.MESSAGE_FOR_ALL };

      return safeEditMessageText(
        bot, chatId, messageId,
        '✍️ *Please enter the message to broadcast to all users:*',
        { inline_keyboard: [[createBackToBroadcastMenuButton()]] },
        'Markdown'
      );
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = users[chatId]?.step;

    if (!state) return; // No active state, ignore message

    if (state === STATES.SELECT_USER) {
      const index = parseInt(msg.text.trim()) - 1;
      const userList = users[chatId].list;

      if (isNaN(index) || index < 0 || index >= userList.length) {
        return bot.sendMessage(chatId, '❌ Invalid selection. Please send a valid number.');
      }

      const targetId = userList[index];
      const targetName = getUserName(targetId);

      users[chatId] = {
        step: STATES.MESSAGE_FOR_SPECIFIC,
        targetId,
        targetName
      };

      return bot.sendMessage(chatId, `✅ Selected *${targetName}*.\n\n✍️ Please enter the message you want to send:`, {
        parse_mode: 'Markdown'
      });
    }

    if (state === STATES.MESSAGE_FOR_SPECIFIC) {
      const { targetId, targetName } = users[chatId];
      const userMessage = msg.text;

      try {
        await bot.sendMessage(targetId, `<b>${userMessage}</b>`, { parse_mode: 'HTML' });
        await bot.sendMessage(chatId, `✅ Message successfully sent to *${targetName}* (ID: ${targetId})`, { parse_mode: 'Markdown' });
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Failed to send message. Error: ${err.message}`);
      }

      users[chatId] = null; // Clear session after sending
    }

    if (state === STATES.MESSAGE_FOR_ALL) {
      const userMessage = msg.text;
      const allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];

      allUsers.forEach(userId => {
        bot.sendMessage(userId, `<b>${userMessage}</b>`, { parse_mode: 'HTML' }).catch(() => {});
      });

      await bot.sendMessage(chatId, `✅ Your broadcast was sent to *${allUsers.length}* users.`, { parse_mode: 'Markdown' });

      users[chatId] = null; // Clear session after broadcast
    }
  });
}

module.exports = { register };
