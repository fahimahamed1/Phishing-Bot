require('dotenv').config();
const { addAdmin } = require('./adminModify');

function loadAdminsFromEnv() {
  const raw = process.env.ADMINS;

  if (!raw) {
    console.warn('No ADMINS found in .env file.');
    return;
  }

  const ids = raw.split(',').map(id => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    console.warn('ADMINS value is empty or invalid.');
    return;
  }

  ids.forEach(chatId => {
    const added = addAdmin(chatId);
    if (added) {
    } else {
      console.log(`Admin already exists: ${chatId}`);
    }
  });
}

module.exports = loadAdminsFromEnv;
