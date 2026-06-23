// api/attendance.js
const RAHBAR_TOKEN = '8991955411:AAHJB7uHBj1-3sGZr7l8Tx0fQJpiYEsyCFI';
const MANAGER_CHAT_ID = '6613741078';

const ACTION_LABELS = {
  came: 'Keldi',
  lunch_out: 'Tushlikka chiqdi',
  lunch_in: 'Tushlikdan keldi',
  left: 'Ketdi'
};
const ACTION_EMOJI = {
  came: '✅',
  lunch_out: '🍽',
  lunch_in: '🔙',
  left: '🚪'
};

if (!global._att) global._att = {};

function today() { return new Date().toISOString().slice(0, 10); }

async function notifyManager(name, action, time, date) {
  const label = ACTION_LABELS[action] || action;
  const emoji = ACTION_EMOJI[action] || '📋';
  const text = emoji + ' ' + label + '\n\n👤 ' + name + '\n🕐 ' + time + '\n📅 ' + date;
  fetch('https://api.telegram.org/bot' + RAHBAR_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: MANAGER_CHAT_ID, text })
  }).catch(() => {});
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const date = req.query.date || today();

  if (req.method === 'GET') {
    return res.json({ ok: true, date, records: Object.values(global._att[date] || {}) });
  }

  if (req.method === 'POST') {
    const { pin, name, action, time, date: d, tgId } = req.body || {};
    const key = d || date;
    if (!pin) return res.status(400).json({ ok: false, error: 'pin kerak' });
    if (!global._att[key]) global._att[key] = {};
    const now = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });
    if (!global._att[key][pin]) global._att[key][pin] = { pin, name, tgId, steps: [] };
    global._att[key][pin].name = name || global._att[key][pin].name;
    global._att[key][pin].tgId = tgId || global._att[key][pin].tgId;
    global._att[key][pin].steps.push({ action, time: time || now });
    global._att[key][pin].lastAction = action;

    // Rahbarga xabar yuborish
    notifyManager(name || 'Xodim', action, time || now, key);

    return res.json({ ok: true });
  }

  res.status(405).json({ ok: false });
};
