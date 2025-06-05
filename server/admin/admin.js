const { isAdmin } = require('../utils/checkAdmin');
const premiumModule = require('./handler/premium');

const modules = [
  require('./handler/premium'),
  require('./handler/pending'),
  require('./handler/approved'),
  require('./handler/suspend'),
  require('./handler/suspended'),
  require('./handler/delete'),
  require('./handler/adduser'),
  require('./handler/addpage'),
  require('./handler/deletepage'),
  require('./handler/broadcast'),
  require('./handler/settimer'),
  require('./handler/timeruser'),
  require('./handler/manageadmin'),
];

// Extracted panel buttons to reuse for "Back to Admin Panel"
const adminPanelButtons = [
  [
    { text: '🔑 Premium', callback_data: 'premium_list' },
    { text: '👥 Pending Users', callback_data: 'view_pending' },
    { text: '🚫 Suspend', callback_data: 'suspend_user' },
  ],
  [
    { text: '🗑️ Delete User', callback_data: 'delete_user' },
    { text: '➕ Add Custom User', callback_data: 'add_custom_user' },
  ],
  [
    { text: '✅ Approved Users', callback_data: 'view_approved' },
    { text: '🚷 Suspended Users', callback_data: 'view_suspended' },
  ],
  [
    { text: '⏱️ Timer Users', callback_data: 'view_timer_users' },
    { text: '⏲️ Set Timer', callback_data: 'set_timer' },
  ],
  [
    { text: '📢 Broadcast', callback_data: 'broadcast' },
    { text: '📄 Add Page', callback_data: 'add_page' },
    { text: '❌ Delete Page', callback_data: 'delete_page' },
  ],
  [
    { text: '👑 Manage Admins', callback_data: 'manage_admin' }
  ]
];

function setupAdminPanel(bot) {
  bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;

    if (!isAdmin(chatId)) {
      return bot.sendMessage(chatId, '❌ Access Denied: You are not authorized to use the admin panel.');
    }

    bot.sendMessage(chatId, '🔧 *Admin Panel:* Choose an option:', {
      reply_markup: { inline_keyboard: adminPanelButtons },
      parse_mode: 'Markdown'
    });
  });

  // Register each handler module
  modules.forEach((mod) => {
    if (typeof mod.register === 'function') {
      mod.register(bot);
    }
  });
}

module.exports = {
  setupAdminPanel,
  adminPanelButtons
};