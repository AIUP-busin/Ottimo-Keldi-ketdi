const TOKEN = process.env.BOT_TOKEN || '8473101745:AAEfYwUFy4WXoeMmuzpWJ3PCtLfisgeO6n0';
const APP_URL = process.env.APP_URL || 'https://ottimo-keldi-ketdi-chi.vercel.app';

if (!global._att)   global._att   = {};
if (!global._pins)  global._pins  = {}; // { pin: {empId,name,position,tgId} }
if (!global._tgmap) global._tgmap = {}; // { tgId: {name,position} }

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update = req.body || {};
    const msg = update.message;
    const cb  = update.callback_query;

    // --- Keldi / Ketdi tugmasi ---
    if (cb) {
      const chatId = cb.message.chat.id;
      const userId = String(cb.from.id);
      const name   = global._tgmap[userId]?.name ||
                     [cb.from.first_name, cb.from.last_name].filter(Boolean).join(' ');
      const pos    = global._tgmap[userId]?.position || '';
      const action = cb.data;
      const date   = today();
      const time   = getTime();

      if (action === 'keldi' || action === 'ketdi') {
        if (!global._att[date]) global._att[date] = {};
        global._att[date][userId] = { userId, name, position: pos, status: action, time, date };

        await tg('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: action === 'keldi' ? `â Kelganingiz qayd etildi â ${time}` : `ð Ketganingiz qayd etildi â ${time}`,
          show_alert: false
        });

        await tg('editMessageText', {
          chat_id:    chatId,
          message_id: cb.message.message_id,
          text: `${action === 'keldi' ? 'ð¢ Keldi' : 'ð´ Ketdi'}\n\nð¤ ${name}${pos ? '\nð ' + pos : ''}\nð ${time}\nð ${date}`,
          reply_markup: { inline_keyboard: [[
            { text: 'ð¢ Keldi', callback_data: 'keldi' },
            { text: 'ð´ Ketdi', callback_data: 'ketdi' }
          ]]}
        });
      }
      return res.status(200).json({ ok: true });
    }

    // --- Xabarlar ---
    if (msg) {
      const chatId = msg.chat.id;
      const userId = String(msg.from.id);
      const name   = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Xodim';
      const text   = (msg.text || '').trim();

      // /start 4838  â  xodimni ro'yxatdan o'tkazish
      const pinMatch = text.match(/^\/start\s+(\d{4})$/) ||
                       text.match(/t\.me\/[^?]+\?start=(\d{4})/);
      if (pinMatch) {
        const pin = pinMatch[1];
        const emp = global._pins[pin];
        if (!emp) {
          await tg('sendMessage', { chat_id: chatId,
            text: "â Havola noto'g'ri. HR admindan yangi havola so'rang." });
          return res.status(200).json({ ok: true });
        }
        emp.tgId = userId;
        global._tgmap[userId] = { name: emp.name, position: emp.position };
        await tg('sendMessage', { chat_id: chatId,
          text: `â Xush kelibsiz, *${emp.name}*!\nð Lavozim: ${emp.position}\n\nQuyidagi tugmalardan foydalaning:`,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[
            { text: 'ð¢ Keldi', callback_data: 'keldi' },
            { text: 'ð´ Ketdi', callback_data: 'ketdi' }
          ]]}
        });
        return res.status(200).json({ ok: true });
      }

      // /start  yoki /menu
      if (text.startsWith('/start') || text.startsWith('/menu')) {
        const reg = global._tgmap[userId];
        await tg('sendMessage', {
          chat_id: chatId,
          text: `ð Assalomu alaykum, *${reg?.name || name}*!\n\nBugungi holatingizni belgilang:`,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [
            [{ text: 'ð¢ Keldi', callback_data: 'keldi' },
             { text: 'ð´ Ketdi', callback_data: 'ketdi' }],
            [{ text: 'ð HR Paneli', web_app: { url: APP_URL } }]
          ]}
        });
        return res.status(200).json({ ok: true });
      }

      // Boshqa xabar
      await tg('sendMessage', { chat_id: chatId,
        text: 'Bugungi holatingizni belgilang:',
        reply_markup: { inline_keyboard: [[
          { text: 'ð¢ Keldi', callback_data: 'keldi' },
          { text: 'ð´ Ketdi', callback_data: 'ketdi' }
        ]]}
      });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(200).json({ ok: true });
  }
};
