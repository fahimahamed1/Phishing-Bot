# Telegram Bot with Admin Dashboard

This project implements a Telegram bot using `Node.js` with Express and `telegraf` for bot functionality, enabling user management and admin control over various features like approval, suspension, and timer settings.

## Features

- **Admin Controls:**
  - Toggle Premium Mode
  - View Pending, Approved, and Suspended Users
  - Suspend or Approve Users
  - Set Timer for Users
  - Add/Remove Pages
  - Broadcast Messages

- **User Management:**
  - User Data Storage and Management
  - Custom User Approval
  - Premium Access Control
  - Timer Setup for Premium Users
  - Notify Users about Premium Status

- **Bot Commands:**
  - `/start`: Initialize the bot and show account status.
  - `/admin`: Access the Admin Panel.

## Requirements

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Telegram Bot Token (to interact with Telegram API)
- Admin Chat ID (for managing the bot)

## Setup Instructions

### 1. Clone the repository

Clone the repository to your local machine using:

```bash
git clone https://github.com/your-username/telegram-bot-admin-dashboard.git

2. Install dependencies

Navigate into the project folder and install the required dependencies:

cd telegram-bot-admin-dashboard
npm install

3. Configure the bot

Create a file named config.js in the root directory.

Add the following configuration values:


module.exports = {
  botToken: 'YOUR_BOT_TOKEN',
  hostURL: 'YOUR_SERVER_URL',
  adminChatId: 'YOUR_ADMIN_CHAT_ID',
};

Replace YOUR_BOT_TOKEN with the token you receive when you create your bot using the BotFather on Telegram, YOUR_SERVER_URL with your server's URL (or leave empty for local testing), and YOUR_ADMIN_CHAT_ID with your Telegram ID (you can get this by messaging your bot and printing the chat ID using the bot's code).

4. Start the bot

To run the bot locally, use the following command:

npm start

The bot will start running on port 3000 by default.

5. Deploy to a server (Optional)

If you wish to deploy the bot to a cloud platform (like Heroku, AWS, or DigitalOcean), make sure to configure environment variables for botToken, hostURL, and adminChatId.

6. Access the Admin Panel

Once the bot is running, you can use the /admin command to access the Admin Panel directly within your Telegram app.

7. Using the Bot

/start Command

When a user interacts with the bot for the first time, they can use the /start command to initialize the bot.

The bot will display the user’s current account status (either Free or Premium) and provide any necessary instructions.


/admin Command

The Admin can access an interactive dashboard where they can toggle Premium mode, view pending users, approve or suspend users, and more.


Bot Features Explained

1. Premium Mode

When Premium Mode is activated, only users who have been approved by the Admin can access the bot. Pending users are notified that they need admin approval.

Premium mode can be toggled by the Admin in the Admin Panel.


2. User Management

Pending Users: Users who are awaiting approval to use the bot.

Approved Users: Users who have been approved to use the bot.

Suspended Users: Users who have been suspended and can no longer use the bot.


3. Timer Management

Admin can set a timer for Premium users, limiting their access to a certain time period.

Users will be notified about their remaining time once the timer is set.

The Admin can view all active timer users and manage them from the dashboard.


4. Add Custom User

The Admin can manually approve users by providing their chat ID.

Admin can add a user to the approved list directly through the Admin Panel.


5. Broadcast Messages

Admin can broadcast messages to all users, including Pending, Approved, and Suspended users.


6. File Management (Add/Delete Pages)

Admin can upload custom .ejs pages to add or delete content from the bot’s website (if applicable).


Folder Structure

.
├── config.js                # Bot and Admin configuration
├── loader.js                # Helper functions for loading and saving user data
├── package.json             # Project dependencies and metadata
├── server.js                # Express server to run the bot
└── views/                   # Folder for EJS views (if applicable)

File Descriptions

config.js: Contains the bot token, server URL, and admin chat ID.

loader.js: Contains functions to load and save user data (including pending, approved, and suspended users).

server.js: The main bot code that initializes the bot, handles commands, and manages user interactions.

views/: Contains the views (if applicable) to be used in the bot's web interface.


Contributing

Feel free to fork the project, create issues, or submit pull requests to improve the bot. Contributions are welcome!

License

This project is open-source and available under the MIT License.


---

Special Thanks

This project was guided and supported by an answer I received from ChatGPT. The detailed guidance helped shape the structure and functionality of the bot, including the implementation of user management and the admin dashboard features. Thank you, ChatGPT!

This addition at the end of the `README.md` thanks and acknowledges my previous response for helping in shaping the project. It will serve as a friendly acknowledgment of the support provided! Let me know if you'd like further adjustments.
