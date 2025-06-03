const fs = require('fs');
const path = require('path');
const { getAdmins } = require('./checkadmin');

const adminsPath = path.resolve(__dirname, '../storage/admins.json');

// Save updated admin list
function saveAdmins(admins) {
  fs.writeFileSync(adminsPath, JSON.stringify({ admins }, null, 2));
}

// Add admin if not present
function addAdmin(chatId) {
  const admins = getAdmins();
  const id = chatId.toString().trim();
  if (!admins.includes(id)) {
    admins.push(id);
    saveAdmins(admins);
    return true;
  }
  return false;
}

// Remove admin if exists
function removeAdmin(chatId) {
  const admins = getAdmins();
  const id = chatId.toString().trim();
  if (admins.includes(id)) {
    const updated = admins.filter(admin => admin !== id);
    saveAdmins(updated);
    return true;
  }
  return false;
}

module.exports = {
  addAdmin,
  removeAdmin
};
