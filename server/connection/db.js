// server/connection/db.js
const fs = require('fs');
const path = require('path');

// Create the 'data' directory in the project root if it doesn't exist
const dataDirectory = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

// File Paths
const usersFile = path.join(dataDirectory, 'users.json');
const approvedUsersFile = path.join(dataDirectory, 'approvedUsers.json');
const pendingUsersFile = path.join(dataDirectory, 'pendingUsers.json');
const suspendedUsersFile = path.join(dataDirectory, 'suspendedUsers.json');
const timerUsersFile = path.join(dataDirectory, 'timerUsers.json');

// Data Stores
const users = {};
let pendingUsers = new Set();
let approvedUsers = new Set();
let suspendedUsers = new Set();
let timerUsers = new Map();

// Load data
const loadUserData = () => {
  if (fs.existsSync(usersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      Object.assign(users, data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  } else {
    fs.writeFileSync(usersFile, JSON.stringify({}));
  }

  if (fs.existsSync(approvedUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(approvedUsersFile, 'utf8'));
      approvedUsers = new Set(data);
    } catch (error) {
      console.error('Error loading approved users:', error);
    }
  }

  if (fs.existsSync(suspendedUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(suspendedUsersFile, 'utf8'));
      suspendedUsers = new Set(data);
    } catch (error) {
      console.error('Error loading suspended users:', error);
    }
  }

  if (fs.existsSync(pendingUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(pendingUsersFile, 'utf8'));
      pendingUsers = new Set(data);
    } catch (error) {
      console.error('Error loading pending users:', error);
    }
  } else {
    fs.writeFileSync(pendingUsersFile, JSON.stringify([]));
  }

  if (fs.existsSync(timerUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(timerUsersFile, 'utf8'));
      for (const userId in data) {
        timerUsers.set(parseInt(userId), data[userId]);
      }
    } catch (error) {
      console.error('Error loading timer users:', error);
    }
  } else {
    fs.writeFileSync(timerUsersFile, JSON.stringify({}));
  }
};

loadUserData();

// Export everything needed
module.exports = {
  users,
  pendingUsers,
  approvedUsers,
  suspendedUsers,
  timerUsers,
  usersFile,
  pendingUsersFile,
  approvedUsersFile,
  suspendedUsersFile,
  timerUsersFile,
  loadUserData
};