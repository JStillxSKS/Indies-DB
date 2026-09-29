/**
 * In-game Indies leaderboard.
 * GET /api/leaderboard?hash=<in_game_hash>&difficulty=easy|normal|hard|extreme|hardcore&mode=classic|arcade&limit=10
 *
 * hash is public.maps.in_game_hash (the short id Smash Drums already shows).
 */
/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */

const HASH_RE = /^[A-Za-z0-9_-]{4,32}$/
const DIFFICULTIES = new Set(['easy', 'normal', 'hard', 'extreme', 'hardcore'])
const GAME_MODES = new Set(['classic', 'arcade'])

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Database not configured' })
  }

  const hash = typeof req.query.hash === 'string' ? req.query.hash.trim() : ''
  const difficulty =
    typeof req.query.difficulty === 'string' ? req.query.difficulty.toLowerCase() : ''
  const mode = typeof req.query.mode === 'string' ? req.query.mode.toLowerCase() : 'classic'
  const limitRaw = Number(req.query.limit)
  const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, Math.floor(limitRaw))) : 10

  if (!HASH_RE.test(hash)) return res.status(400).json({ error: 'Invalid hash' })
  if (!DIFFICULTIES.has(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' })
  if (!GAME_MODES.has(mode)) return res.status(400).json({ error: 'Invalid game mode' })
  if (difficulty === 'hardcore' && mode !== 'classic') {
    return res.status(400).json({ error: 'Hardcore is Classic only' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  }

  try {
    const mapRes = await fetch(
      `${supabaseUrl}/rest/v1/maps?in_game_hash=eq.${encodeURIComponent(hash)}&select=id,title,artist&limit=1`,
      { headers },
    )
    if (!mapRes.ok) {
      return res.status(502).json({ error: 'Map lookup failed' })
    }
    const maps = await mapRes.json()
    const map = Array.isArray(maps) ? maps[0] : null
    if (!map?.id) {
      return res.status(404).json({ error: 'No map for that hash', hash, entries: [] })
    }

    const scoreRes = await fetch(
      `${supabaseUrl}/rest/v1/scores?map_id=eq.${map.id}&difficulty=eq.${difficulty}&game_mode=eq.${mode}&select=player_name,score&order=score.desc,created_at.asc&limit=${limit}`,
      { headers },
    )
    if (!scoreRes.ok) {
      return res.status(502).json({ error: 'Score lookup failed' })
    }
    const rows = await scoreRes.json()
    const entries = (Array.isArray(rows) ? rows : []).map((row, index) => ({
      rank: index + 1,
      name: String(row.player_name || '').slice(0, 32),
      score: Number(row.score) || 0,
    }))

    return res.status(200).json({
      hash,
      title: map.title,
      artist: map.artist,
      difficulty,
      mode,
      entries,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Lookup failed' })
  }
}
