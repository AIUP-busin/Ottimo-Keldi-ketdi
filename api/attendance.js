// Shared in-memory attendance store
if (!global._att) global._att = {};

function today() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const date = req.query.date || today();

  if (req.method === 'GET') {
    const records = global._att[date] || {};
    return res.status(200).json({
      ok: true,
      date,
      records: Object.values(records)
    });
  }

  if (req.method === 'POST') {
    const { userId, name, status, time } = req.body || {};
    if (!userId || !status) return res.status(400).json({ ok: false, error: 'userId va status kerak' });
    if (!global._att[date]) global._att[date] = {};
    global._att[date][userId] = {
      userId, name, status,
      time: time || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' }),
      date
    };
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
