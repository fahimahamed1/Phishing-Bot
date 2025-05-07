// server/utils/showusername.js

const { users } = require('../connection/db');

// Helper: Get user full name
const getUserName = (userId) => {
  const user = users[userId];
  if (user) {
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return `User not found: ${userId}`;
};

// Helper: Get all user details
const getAllUserDetails = () => {
  return Object.values(users).map(user => ({
    firstName: user.firstName,
    lastName: user.lastName,
    chatId: user.chatId,
    username: user.username,
    email: user.email || 'N/A',
    phoneNumber: user.phoneNumber || 'N/A',
    status: user.status,
    joinDate: user.joinDate
  }));
};

module.exports = { getUserName, getAllUserDetails };
