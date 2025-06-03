const fs = require('fs');
const path = require('path');

const adminsPath = path.resolve(__dirname, '../storage/admins.json');

// Ensure admins.json exists
function ensureAdminsFile() {
  if (!fs.existsSync(adminsPath)) {
    fs.writeFileSync(adminsPath, JSON.stringify({ admins: [] }, null, 2));
  }
}

// Load current admins from file
function getAdmins() {
  ensureAdminsFile();
  const data = fs.readFileSync(adminsPath, 'utf8');
  const { admins } = JSON.parse(data);
  return admins.map(id => id.toString().trim());
}

// Check if chatId is admin
function isAdmin(chatId) {
  return getAdmins().includes(chatId.toString());
}

module.exports = {
  getAdmins,
  isAdmin
};
