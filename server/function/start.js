// server/function/start.js
const fs = require('fs');
const { bot } = require('../serverSetup');
const { users, pendingUsers, approvedUsers, suspendedUsers, timerUsers, usersFile, pendingUsersFile } = require('../connection/db');
const { isAdmin } = require('../utils/helpers');
const { getPremiumMode } = require('../admin/handler/premium');
const { getRemainingTime } = require('../admin/handler/timeruser');
const { adminChatId } = require('../connection/config');


// Handle /start command
bot.onText(/\/start/, (msg) => {
  handleStartCommand(msg);
});

const handleStartCommand = (msg) => {
  const { id: chatId, first_name, last_name } = msg.chat;
  const fullName = `${first_name || "User"} ${last_name || ""}`.trim();

  // Store user data if not already stored
  if (!users[chatId]) {
    users[chatId] = { firstName: first_name, lastName: last_name, chatId };
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }

  // Handle Admin Users
  if (isAdmin(chatId)) {
    bot.sendMessage(
      chatId,
      `👋 Welcome, ${fullName}!\n😊 You are an Admin.\n🆔 Chat ID: ${chatId}\n🔹 Account Status: Full Access\n\n📊 **User Stats:**\n👥 Total: ${approvedUsers.size}\n⏳ Pending: ${pendingUsers.size}\n✅ Approved: ${approvedUsers.size}\n🚫 Suspended: ${suspendedUsers.size}\n⏲️ Timer Users: ${timerUsers.size}`
    );
    return;
  }

  // Default status
  let accountStatus = "Free";
  let statusMessage = "You can use the bot freely.";
  let remainingTimeMessage = "";

  if (getPremiumMode()) {
    if (approvedUsers.has(chatId)) {
      accountStatus = "Premium User";

      // Check if user has an active timer
      if (timerUsers.has(chatId)) {
        const { expireTime } = timerUsers.get(chatId);
        const remainingTime = getRemainingTime(expireTime);

        remainingTimeMessage = `\n⌛ **Remaining Time:** ${remainingTime.days} days, ${remainingTime.hours} hours, ${remainingTime.minutes} minutes`;
      }
    } else if (pendingUsers.has(chatId)) {
      accountStatus = "Pending Approval";
    } else if (suspendedUsers.has(chatId)) {
      accountStatus = "Suspended";
    } else {
      pendingUsers.add(chatId);

      // Save the pending users list
      const pendingArr = Array.from(pendingUsers);
      fs.writeFileSync(pendingUsersFile, JSON.stringify(pendingArr, null, 2));

      bot.sendMessage(adminChatId, `🔔 New user pending approval: ${chatId}`);
      accountStatus = "Pending Approval";
    }

    statusMessage = "Premium Mode is ON. Approval required to use the bot.";
  }

  // Send the messages
  bot.sendMessage(
    chatId,
    `👋 Welcome, ${fullName}!\n🆔 Chat ID: ${chatId}\n🔹 Account Status: ${accountStatus}\n\n${statusMessage}${remainingTimeMessage}`,
    { parse_mode: "Markdown" }
  );
};

module.exports = { handleStartCommand };
