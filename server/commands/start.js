// server/admin/src/commands/start.js
const { isAdmin } = require('../admin/src/utils/checkadmin');
const { getUserStatus } = require('../admin/src/utils/startHelper/getUserStatus');
const { formatStartMessage } = require('../admin/src/utils/startHelper/formatStartMessage');
const { notifyAdmin } = require('../admin/src/utils/startHelper/notifyAdmin');

function handleStartCommand(bot, msg) {
  const { id: chatId, first_name, last_name } = msg.chat;
  const fullName = `${first_name || "User"} ${last_name || ""}`.trim();

  if (isAdmin(chatId)) {
    const adminMessage = formatStartMessage({ chatId, fullName, isAdmin: true });
    bot.sendMessage(chatId, adminMessage, { parse_mode: "Markdown" });
    return;
  }

  const { status, message, notifyAdminFlag } = getUserStatus(chatId);
  if (notifyAdminFlag) notifyAdmin(bot, chatId);

  const userMessage = formatStartMessage({ chatId, fullName, status, message });
  bot.sendMessage(chatId, userMessage, { parse_mode: "Markdown" });
}

module.exports = { handleStartCommand };
