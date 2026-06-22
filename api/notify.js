// api/notify.js â rahbar o'zgartirsa, xodim botiga xabar yuboradi
const XODIM_TOKEN = process.env.XODIM_BOT_TOKEN || '8473101745:AAEfYwUFy4WXoeMmuzpWJ3PCtLfisgeO6n0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { tgId, message } = req.body || {};
    if (!tgId || !message) return res.status(400).json({ ok: false, error: 'tgId va message kerak' });

    const r = await fetch(`https://api.telegram.org/bot${XODIM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgId, text: message, parse_mode: 'Markdown' })
    });
    const data = await r.json();
    return res.json({ ok: data.ok, result: data });
  }

  res.status(405).json({ ok: false });
};
