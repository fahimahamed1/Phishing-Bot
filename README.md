# Telegram Bot Admin Panel

This project is a Telegram bot with an admin panel that includes various functionalities for user management, premium mode toggle, user approval, suspensions, timer settings, page management, and more.

## Features

- **Admin Panel**: Access to the admin panel for authorized users.
  - Toggle Premium Mode.
  - View and manage pending users.
  - Suspend or delete users.
  - Add custom users.
  - Manage users with timers.
  - Broadcast messages.
  - Add or delete pages.

- **Premium Mode**: Admins can toggle premium mode, which restricts non-approved users from using the bot.

- **User Management**:
  - **Pending Users**: View and approve users who are waiting for approval.
  - **Approved Users**: View all approved users.
  - **Suspended Users**: View and manage suspended users.

- **Timers**:
  - Admins can set timers for users, specifying validity periods.
  - Admins can remove timers from users.
  
- **Page Management**:
  - Admins can add and delete `.ejs` pages.

## Requirements

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Telegram Bot Token (to interact with Telegram API)
- Admin Chat ID (for managing the bot)

## Installation

To run this bot locally or server, follow these steps:

### Prerequisites
- Node.js (v14.x or higher)
- Telegram Bot Token (Create a bot via [BotFather](https://core.telegram.org/bots#botfather))

### Steps

1. clone the repository
   ```bash
   git clone https://github.com/fahimahamed1/Phishing-bot.git

2. cd Phishing-bot

3. Configure the bot

   open server/connection/config.js 
   Add the following configuration values:
   ```bash
   module.exports = {
      botToken: 'YOUR_BOT_TOKEN',
      hostURL: 'YOUR_SERVER_URL',
      adminChatId: 'YOUR_ADMIN_CHAT_ID'
      };
4. npm start


Would you like to include steps for installing dependencies and starting the bot as well?

