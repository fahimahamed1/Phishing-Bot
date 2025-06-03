const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

// Load config from .env
const botToken = process.env.BOT_TOKEN;
const hostURL = process.env.HOST_URL;
const PORT = process.env.PORT || 3000;

// Create bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Create Express app
const app = express();

// Set EJS as view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Health check route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Register page routes
const { registerPageRoutes } = require('./routes/pageRoutes');
registerPageRoutes(app, bot);

// Initialize all bot handlers
const { initBotHandlers } = require('./init');
initBotHandlers(bot);

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running at: ${hostURL}:${PORT}`);
});

// Export app and bot if needed elsewhere
module.exports = { app };
