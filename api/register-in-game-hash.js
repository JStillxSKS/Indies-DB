/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */
const HASH_RE = /^[A-Za-z0-9_-]{4,32}$/

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.BOT_REGISTER_SECRET
  if (!secret) {
    return res.status(503).json({ error: 'BOT_REGISTER_SECRET not configured' })
  }

  const auth = req.headers.authorization || ''
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  const provided =
    (typeof body.secret === 'string' && body.secret) ||
    (auth.startsWith('Bearer ') ? auth.slice(7) : '')

  if (provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Database not configured' })
  }

  const hash = typeof body.hash === 'string' ? body.hash.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const artist = typeof body.artist === 'string' ? body.artist.trim() : ''

  if (!HASH_RE.test(hash)) {
    return res.status(400).json({ error: 'Invalid hash' })
  }
  if (!title) {
    return res.status(400).json({ error: 'Title required' })
  }

  try {
    const register = await fetch(`${supabaseUrl}/rest/v1/rpc/register_in_game_hash`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_hash: hash,
        p_title: title,
        p_artist: artist,
      }),
    })

    if (!register.ok) {
      const errText = await register.text()
      return res.status(register.status).json({ error: errText || 'Register failed' })
    }

    const result = await register.json()
    return res.status(200).json({
      ok: true,
      mapId: result?.map_id ?? result,
      title: result?.title ?? title,
      artist: result?.artist ?? artist,
      hash,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}