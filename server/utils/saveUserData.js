// server/admin/src/utils/saveUserData.js
const fs = require('fs');
const { users, usersFile } = require('../connection/db');

const saveUserData = (msg) => {
  const { id: chatId, first_name, last_name, username } = msg.chat;
  const fullName = `${first_name || "User"} ${last_name || ""}`.trim();

  if (!users[chatId]) {
    users[chatId] = {
      firstName: first_name,
      lastName: last_name,
      chatId,
      username: username || "N/A",
      email: null,
      phoneNumber: null,
      status: "Active",
      joinDate: new Date().toISOString().split('T')[0],
    };

    try {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error("❌ Failed to save user data:", error);
    }
  }
};

function registerUserTracker(bot) {
  bot.on('message', (msg) => {
    if (msg.chat) {
      saveUserData(msg);
    }
  });
}

module.exports = { saveUserData, registerUserTracker };
