// Server/init.js
const loadAdminsFromEnv = require('./utils/envload');
const { ensureBotInit } = require('./utils/ensureBotInit');
const { handleStartCommand } = require('./commands/start');
const { handleCreateCommand, register: registerCreateHandlers } = require('./commands/create');
const { registerUserTracker } = require('./utils/saveUserData');
const { setupAdminPanel } = require('./admin/admin');
const { handleHelpCommand } = require('./commands/help');

// Accept bot as parameter to register handlers
function initBotHandlers(bot) {
  // Load admin list from environment variables
  loadAdminsFromEnv();
  
  // Use the separated utility function here
  ensureBotInit(bot);

  // Register /start command
  bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));

  // Register /create command
  bot.onText(/\/create/, (msg) => handleCreateCommand(bot, msg));
  
  // help handler
  bot.onText(/\/help/, (msg) => handleHelpCommand(bot, msg));

  // Register selection + URL logic from create.js
  registerCreateHandlers(bot);

  // Setup admin panel (includes its own callback handlers)
  setupAdminPanel(bot);

  // Track and save new user data
  registerUserTracker(bot);
}

// Export the handler function
module.exports = { initBotHandlers };
