/**
 * Increment download count after a successful headset install.
 * POST /api/increment-download  { "mapId": "<uuid>" }
 */
/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Database not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  const mapId = typeof body.mapId === 'string' ? body.mapId.trim() : ''
  if (!UUID_RE.test(mapId)) {
    return res.status(400).json({ error: 'Invalid mapId' })
  }

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_download`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ map_id: mapId }),
    })
    if (!r.ok) {
      const text = await r.text()
      return res.status(502).json({ error: 'Upstream error', detail: text.slice(0, 200) })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
