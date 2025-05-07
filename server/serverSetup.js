const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// Config
const { botToken, hostURL } = require('./connection/config');
const bot = new TelegramBot(botToken, { polling: true });
module.exports.bot = bot;

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// App Setup
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bot Commands
const { handleStartCommand } = require('./function/start');
const { handleCreateCommand } = require('./function/create');

// Register bot command handlers
bot.onText(/\/start/, (msg) => handleStartCommand(msg));
bot.onText(/\/create/, (msg) => handleCreateCommand(msg));

// Admin panel setup
require('./admin/admin').setupAdminPanel(bot);

// Routes
app.use('/', require('./routes/pageRoutes'));

// Export for use in run.js or index.js
module.exports = { app, bot, hostURL };
