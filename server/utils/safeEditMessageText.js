const lastMessageCache = {};

function safeEditMessageText(bot, chatId, messageId, newText, replyMarkup) {
  const key = `${chatId}_${messageId}`;
  const currentCache = lastMessageCache[key] || {};
  const newMarkup = JSON.stringify(replyMarkup?.inline_keyboard || []);

  if (currentCache.text !== newText || currentCache.markup !== newMarkup) {
    bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
      parse_mode: 'Markdown',
    });
    lastMessageCache[key] = { text: newText, markup: newMarkup };
  }
}

module.exports = { safeEditMessageText };
