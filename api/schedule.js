// api/schedule.js â per-employee schedule store
if (!global._schedules) global._schedules = {}; // { pin: '09:00 - 18:00' }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { pin, schedule } = req.body || {};
    if (!pin || !schedule) return res.status(400).json({ ok: false });
    global._schedules[String(pin)] = schedule;
    return res.json({ ok: true });
  }

  if (req.method === 'GET') {
    const { pin } = req.query;
    if (!pin) return res.json({ ok: true, schedules: global._schedules });
    return res.json({ ok: true, schedule: global._schedules[String(pin)] || null });
  }

  res.status(405).json({ ok: false });
};
