function handleHelpCommand(bot, msg) {
  const chatId = msg.chat.id;

  const helpMessage = `
🤖 <b>Welcome to Your Assistant Bot!</b>

I’m here to help you manage custom login pages and more. Here’s what you can do:

🟢 <b>/start</b> – Begin your journey. This sets up everything for you to get started.
🛠️ <b>/create</b> – Choose a design and enter your own URL to generate a unique login link.
👑 <b>/admin</b> – (Admins only) Manage users, view stats, and control settings.
❓ <b>/help</b> – You're looking at it! This shows you all available options.

💡 <b>Pro Tips:</b>
- Stick to the commands above for best results.
- If you send random messages or unknown commands, I’ll gently remind you to check this menu.

🙋‍♂️ <b>Need support?</b>
If you’re stuck or something doesn’t seem right, feel free to reach out to the admin:
👉 <a href="https://t.me/fahimahamed10">@fahimahamed10</a>

I’m always here to guide you. Let's make things simple and smooth. 😊
  `;

  bot.sendMessage(chatId, helpMessage.trim(), { parse_mode: 'HTML' });
}

module.exports = { handleHelpCommand };
