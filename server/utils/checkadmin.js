const path = require('path');
const configPath = path.resolve(__dirname, '../connection/config');

// Helper: Dynamically reload config to get the latest admin list
const getAdmins = () => {
  delete require.cache[require.resolve(configPath)];
  const { adminChatId } = require(configPath);
  return adminChatId.split(',').map(id => id.trim());
};

// Helper: Check if a user is an admin (supports multiple admins)
const isAdmin = (chatId) => {
  const adminIds = getAdmins();
  return adminIds.includes(chatId.toString());
};

module.exports = { isAdmin };