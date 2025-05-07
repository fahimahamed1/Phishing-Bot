// server/serverSetup.js
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// Config
const { botToken, hostURL } = require('./connection/config');
const bot = new TelegramBot(botToken, { polling: true });
module.exports.bot = bot;

// App Setup
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Bot Commands
const { handleStartCommand } = require('./function/start');
const { handleCreateCommand } = require('./function/create');
bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));
bot.onText(/\/create/, (msg) => handleCreateCommand(bot, msg));

// Admin Panel
require('./admin/admin').setupAdminPanel(bot);

// Routes
app.use('/', require('./routes/pageRoutes'));

// Export app for later use in run.js
module.exports = { app, bot, hostURL };