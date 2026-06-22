// api/attendance.js
if (!global._att) global._att = {};

function today() { return new Date().toISOString().slice(0, 10); }

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
    const now = new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tashkent'});
    if (!global._att[key][pin]) global._att[key][pin] = { pin, name, tgId, steps: [] };
    global._att[key][pin].name   = name  || global._att[key][pin].name;
    global._att[key][pin].tgId   = tgId  || global._att[key][pin].tgId;
    global._att[key][pin].steps.push({ action, time: time || now });
    global._att[key][pin].lastAction = action;
    return res.json({ ok: true });
  }

  res.status(405).json({ ok: false });
};
