// showusername.js

const { users } = require('../connection/db');

// Get user full name safely
const getUserName = (userId) => {
  const user = users[userId];
  if (user && user.firstName) {
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return `User not found: ${userId}`;
};

// Get all user details safely
const getAllUserDetails = () => {
  return Object.values(users)
    .filter(user => user && typeof user === 'object' && user.chatId) // Ensure valid user object
    .map(user => ({
      firstName: user.firstName || 'N/A',
      lastName: user.lastName || '',
      chatId: user.chatId,
      username: user.username || 'N/A',
      email: user.email || 'N/A',
      phoneNumber: user.phoneNumber || 'N/A',
      status: user.status || 'Unknown',
      joinDate: user.joinDate || 'N/A'
    }));
};

module.exports = { getUserName, getAllUserDetails };
