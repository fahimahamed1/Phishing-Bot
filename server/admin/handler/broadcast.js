// server/admin/handler/broadcast.js
const { approvedUsers, pendingUsers, suspendedUsers, users } = require('../../connection/db');
const { isAdmin, getUserName } = require('../../utils/helpers');

const STATES = {
  SELECT_USER: 'broadcast_select_user',
  MESSAGE_FOR_SPECIFIC: 'broadcast_msg_specific',
  MESSAGE_FOR_ALL: 'broadcast_msg_all'
};

function register(bot) {
  // Handle broadcast button press
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data !== 'broadcast') return;

    if (!isAdmin(chatId)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Access Denied",
        show_alert: true
      });
    }

    bot.answerCallbackQuery(callbackQuery.id); // Acknowledge button click

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Specific', callback_data: 'broadcast_specific' },
            { text: 'All', callback_data: 'broadcast_all' }
          ],
        ]
      }
    };

    bot.sendMessage(chatId, 'Please choose how to broadcast the message:', options);
  });

  // Handle sub-options
  bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (!data.startsWith('broadcast_') || data === 'broadcast') return;

    if (!isAdmin(chatId)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Unauthorized",
        show_alert: true
      });
    }

    bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'broadcast_specific') {
      const userList = [...approvedUsers, ...pendingUsers, ...suspendedUsers];
      if (userList.length === 0) {
        return bot.sendMessage(chatId, '❌ No users found.');
      }

      let msg = '*Select a user to send a message:*\n\n';
      userList.forEach((id, i) => {
        const name = getUserName(id);
        msg += `${i + 1}. ${name} (ID: ${id})\n`;
      });

      users[chatId] = { step: STATES.SELECT_USER, list: userList };
      bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    }

    if (data === 'broadcast_all') {
      users[chatId] = { step: STATES.MESSAGE_FOR_ALL };
      bot.sendMessage(chatId, 'Enter the message to broadcast to all users:');
    }
  });

  // Handle message replies
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = users[chatId]?.step;

    if (!state) return;

    if (state === STATES.SELECT_USER) {
      const index = parseInt(msg.text.trim()) - 1;
      const list = users[chatId].list;

      if (isNaN(index) || index < 0 || index >= list.length) {
        return bot.sendMessage(chatId, '❌ Invalid selection.');
      }

      const targetId = list[index];
      const targetName = getUserName(targetId);

      users[chatId] = {
        step: STATES.MESSAGE_FOR_SPECIFIC,
        targetId,
        targetName
      };

      bot.sendMessage(chatId, `Selected *${targetName}* (ID: ${targetId}).\nEnter your message:`, {
        parse_mode: 'Markdown'
      });
    }

    else if (state === STATES.MESSAGE_FOR_SPECIFIC) {
      const { targetId, targetName } = users[chatId];
      const userMessage = msg.text;

      try {
        await bot.sendMessage(targetId, `<b>${userMessage}</b>`, { parse_mode: 'HTML' });
        await bot.sendMessage(chatId, `✅ Message sent to ${targetName} (ID: ${targetId})`);
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Failed to send message. Error: ${err.message}`);
      }

      users[chatId] = null;
    }

    else if (state === STATES.MESSAGE_FOR_ALL) {
      const userMessage = msg.text;
      const allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];

      allUsers.forEach(id => {
        bot.sendMessage(id, `<b>${userMessage}</b>`, { parse_mode: 'HTML' }).catch(() => {});
      });

      bot.sendMessage(chatId, `✅ Broadcast sent to ${allUsers.length} users.`);
      users[chatId] = null;
    }
  });
}

module.exports = { register };