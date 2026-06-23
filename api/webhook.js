const XODIM_TOKEN = '8473101745:AAEfYwUFy4WXoeMmuzpWJ3PCtLfisgeO6n0';
const RAHBAR_TOKEN = '8991955411:AAHJB7uHBj1-3sGZr7l8Tx0fQJpiYEsyCFI';
const MANAGER_CHAT_ID = '6613741078';
const APP_URL = 'https://ottimohodimlar.netlify.app/';

if (!global._att) global._att = {};
if (!global._pins) global._pins = {};
if (!global._tgmap) global._tgmap = {};

async function tgX(method, body) {
  return fetch('https://api.telegram.org/bot' + XODIM_TOKEN + '/' + method, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(r => r.json());
}
async function tgR(method, body) {
  return fetch('https://api.telegram.org/bot' + RAHBAR_TOKEN + '/' + method, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(r => r.json());
}

function today() { return new Date().toISOString().slice(0, 10); }
function getTime() {
  return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
}

const ACTION_LABEL = { keldi: 'Keldi', ketdi: 'Ketdi' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  try {
    const update = req.body || {};
    const msg = update.message;
    const cb = update.callback_query;

    if (cb) {
      const chatId = cb.message.chat.id;
      const userId = String(cb.from.id);
      const name = global._tgmap[userId]?.name ||
        [cb.from.first_name, cb.from.last_name].filter(Boolean).join(' ');
      const pos = global._tgmap[userId]?.position || '';
      const action = cb.data;
      const date = today();
      const time = getTime();

      if (action === 'keldi' || action === 'ketdi') {
        if (!global._att[date]) global._att[date] = {};
        global._att[date][userId] = { userId, name, position: pos, status: action, time, date };

        const label = ACTION_LABEL[action];
        const msgText = (action === 'keldi' ? '✅ ' : '🚪 ') + label +
          '\n\n👤 ' + name + (pos ? '\n💼 ' + pos : '') +
          '\n🕐 ' + time + '\n📅 ' + date;

        await tgX('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: action === 'keldi' ? 'Kelganingiz qayd etildi!' : 'Ketganingiz qayd etildi!',
          show_alert: false
        });

        // Rahbarga xabar
        await tgR('sendMessage', { chat_id: MANAGER_CHAT_ID, text: msgText });

        await tgX('editMessageText', {
          chat_id: chatId, message_id: cb.message.message_id, text: msgText,
          reply_markup: { inline_keyboard: [[
            { text: '✅ Keldi', callback_data: 'keldi' },
            { text: '🚪 Ketdi', callback_data: 'ketdi' }
          ]]}
        });
      }
      return res.status(200).json({ ok: true });
    }

    if (msg) {
      const chatId = msg.chat.id;
      const userId = String(msg.from.id);
      const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Xodim';
      const text = (msg.text || '').trim();

      const pinMatch = text.match(/^\/start\s+(\d{4})$/) || text.match(/t\.me\/[^?]+\?start=(\d{4})/);
      if (pinMatch) {
        const pin = pinMatch[1];
        const emp = global._pins[pin];
        if (!emp) {
          await tgX('sendMessage', { chat_id: chatId, text: "Havola notogri. HR admindan yangi havola sorang." });
          return res.status(200).json({ ok: true });
        }
        emp.tgId = userId;
        global._tgmap[userId] = { name: emp.name, position: emp.position };
        await tgX('sendMessage', {
          chat_id: chatId,
          text: 'Xush kelibsiz, ' + emp.name + '!\n💼 Lavozim: ' + emp.position + '\n\nQuyidagi tugmalardan foydalaning:',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Keldi', callback_data: 'keldi' },
            { text: '🚪 Ketdi', callback_data: 'ketdi' }
          ]]}
        });
        return res.status(200).json({ ok: true });
      }

      if (text.startsWith('/start') || text.startsWith('/menu')) {
        const reg = global._tgmap[userId];
        await tgX('sendMessage', {
          chat_id: chatId,
          text: 'Assalomu alaykum, ' + (reg?.name || name) + '!\n\nBugungi holatingizni belgilang:',
          reply_markup: { inline_keyboard: [
            [{ text: '✅ Keldi', callback_data: 'keldi' }, { text: '🚪 Ketdi', callback_data: 'ketdi' }],
            [{ text: '📱 Mini App', web_app: { url: APP_URL } }]
          ]}
        });
        return res.status(200).json({ ok: true });
      }

      await tgX('sendMessage', {
        chat_id: chatId, text: 'Bugungi holatingizni belgilang:',
        reply_markup: { inline_keyboard: [[
          { text: '✅ Keldi', callback_data: 'keldi' },
          { text: '🚪 Ketdi', callback_data: 'ketdi' }
        ]]}
      });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(200).json({ ok: true });
  }
};
