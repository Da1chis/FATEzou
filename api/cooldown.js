// api/cooldown.js
// Cek sisa cooldown suatu nomor tanpa blast

// Shared store (same instance = same map; Vercel may spin new instances)
// Untuk production bisa ganti dengan Redis/KV, tapi untuk use case ini cukup
const cooldownMap = new Map();
const COOLDOWN_MS = 120_000;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { nomor } = req.query;
  if (!nomor) return res.status(400).json({ error: 'nomor required' });

  const now    = Date.now();
  const expiry = cooldownMap.get(nomor) || 0;
  const left   = Math.max(0, Math.ceil((expiry - now) / 1000));

  return res.status(200).json({
    nomor,
    cooldown:    left,
    cooldown_ms: COOLDOWN_MS,
    ready:       left === 0,
  });
}
