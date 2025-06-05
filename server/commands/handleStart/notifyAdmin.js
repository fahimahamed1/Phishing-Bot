// server/admin/src/utils/startHelper/notifyAdmin.js
const { getAdmins } = require('../../utils/checkAdmin');

function notifyAdmin(bot, newUserChatId) {
  const primaryAdmin = getAdmins()[0];
  if (primaryAdmin) {
    bot.sendMessage(
      primaryAdmin,
      `🔔 New user pending approval: \`${newUserChatId}\``,
      { parse_mode: "Markdown" }
    );
  }
}

module.exports = { notifyAdmin };
