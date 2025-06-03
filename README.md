# Telegram Bot Admin Panel

A Telegram bot with a powerful admin panel to manage users, toggle premium mode, handle approvals, suspensions, timers, pages, and more — all from within Telegram.

---

## Features

- **Admin Panel**  
  Manage the bot via an easy-to-use panel accessible to authorized admins:
  - Toggle **Premium Mode** to restrict access to approved users only.
  - View and approve **Pending Users**.
  - Suspend or delete users.
  - Add custom users manually.
  - Manage users with timers for limited access.
  - Broadcast messages to users.
  - Add or delete `.ejs` pages for the bot interface.

- **User Management**  
  Keep track of:
  - Users waiting for approval.
  - Approved users.
  - Suspended users.

- **Timers**  
  Set time-based access for users and remove timers when needed.

- **Page Management**  
  Easily add or remove interface pages used by the bot.

---

## Requirements

- **Node.js** (v14.x or higher)
- **npm** (v6.x or higher)
- **Telegram Bot Token** (via [BotFather](https://core.telegram.org/bots#botfather))
- **Telegram Admin User ID(s)** — for admin access to the bot

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/fahimahamed1/Phishing-bot.git
cd Phishing-bot
```

### 2. Create a `.env` file

In the root folder, create a `.env` file and add your configuration:

```env
BOT_TOKEN=your_bot_token_here
HOST_URL=your_host_url_here
PORT=3000
ADMINS=comma_separated_admin_ids
```

- **BOT_TOKEN:** Your Telegram bot token from BotFather.
- **HOST_URL:** Your server URL or `localhost` for local testing.
- **PORT:** Port number to run the bot (default is 3000).
- **ADMINS:** Telegram user IDs for admins (comma-separated if more than one).

### 3. Install dependencies

```bash
npm install
```

### 4. Start the bot

```bash
npm start
```

The bot should now be up and running! Admins can access the admin panel through Telegram.

---

## Usage

- Only users listed as admins in `.env` under `ADMINS` can access the admin panel.
- Admins can approve or suspend users, toggle premium mode, manage timers, and more directly via Telegram commands and buttons.
- Premium mode restricts the bot’s usage to approved users only.
- Timers allow temporary access control for users.

---

## Troubleshooting

- **Bot not responding?**  
  Make sure your `BOT_TOKEN` is correct and the bot is started (`npm start`).

- **Admin commands not working?**  
  Check that your Telegram user ID is included in the `ADMINS` environment variable.

- **Port conflicts?**  
  Change the `PORT` in `.env` if the default port is busy.

---

## Contributing

Feel free to open issues or submit pull requests! Suggestions and improvements are welcome.

---

## License

This project is open source and free to use under the MIT License.

---

If you want, I can also help you add example admin commands, screenshots, or a quick start guide section — just ask!
