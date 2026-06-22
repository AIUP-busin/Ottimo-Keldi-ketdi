const TOKEN = process.env.BOT_TOKEN || '8473101745:AAEfYwUFy4WXoeMmuzpWJ3PCtLfisgeO6n0';
const APP_URL = process.env.APP_URL || 'https://ottimo-keldi-ketdi-chi.vercel.app';

// In-memory store (shared across warm instances)
if (!global._att) global._att = {};

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getTime() {
  return new Date().toLocaleTimeString('uz-UZ', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent'
  });
}

function statusBadge(status) {
  if (status === 'keldi') return 'ð¢ Keldi';
  if (status === 'ketdi') return 'ð´ Ketdi';
  return 'â« Noma\'lum';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update = req.body || {};
    const msg = update.message;
    const cb = update.callback_query;

    // --- Callback: Keldi / Ketdi tugmasi bosildi ---
    if (cb) {
      const chatId = cb.message.chat.id;
      const userId = cb.from.id;
      const name = [cb.from.first_name, cb.from.last_name].filter(Boolean).join(' ');
      const action = cb.data; // 'keldi' | 'ketdi'
      const date = today();
      const time = getTime();

      if (action === 'keldi' || action === 'ketdi') {
        if (!global._att[date]) global._att[date] = {};
        global._att[date][userId] = { userId, name, status: action, time, date };

        await tg('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: action === 'keldi' ? `\u2705 Kelganingiz qayd etildi \u2014 ${time}` : `\u1f44b Ketganingiz qayd etildi \u2014 ${time}`,
          show_alert: false
        });

        await tg('editMessageText', {
          chat_id: chatId,
          message_id: cb.message.message_id,
          text: `${statusBadge(action)}\n\n\u1f464 ${name}\n\u1f550 ${time}\n\u1f4c5 ${date}`,
          reply_markup: {
            inline_keyboard: [[
              { text: '\u1f7e2 Keldi', callback_data: keldi' },
              { text: '\u1f534 Ketdi', callback_data: 'ketdi' }
            ]]
          }
        });
      }

      return res.status(200).json({ ok: true });
    }

    // --- Oddiy xabar yoki /start ---
    if (msg) {
      const chatId = msg.chat.id;
      const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Xodim';
      const text = msg.text || '';

      if (text.startsWith('/start') || text.startsWith('/menu')) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `\u1f44b Assalomu alaykum, <b>${name}</b>!\n\nBugungi holatingizni belgilang:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '\u1f7e2 Keldi', callback_data: keldi' },
                { text: '\u1f534 Ketdi', callback_data: ketdi' }
              ],
              [
                { text: '\u1f4ca HR Paneli (Admin)', web_app: { url: APP_URL} }
              ]
            ]
          }
        });
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Bugungi holatingizni belgilang:`,
          reply_markup: {
            inline_keyboard: [[
              { text: '\u1f7e2 Keldi', callback_data: 'keldi' },
              { text: '\u1f534 Ketdi', callback_data: ketdi' }
            ]]
          }
        });
      }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(200).json({ ok: true });
  }
};
