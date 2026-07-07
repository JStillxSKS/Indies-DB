/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DIFFICULTIES = new Set(['easy', 'normal', 'hard', 'extreme', 'hardcore'])

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

  let mapId = typeof body.mapId === 'string' && UUID_RE.test(body.mapId) ? body.mapId : null
  const difficulty = typeof body.difficulty === 'string' ? body.difficulty.toLowerCase() : ''
  const playerName = typeof body.playerName === 'string' ? body.playerName.trim() : ''
  const score = Number(body.score)
  const accuracy = body.accuracy != null ? Number(body.accuracy) : null
  const maxCombo = body.maxCombo != null ? Number(body.maxCombo) : null
  const modVersion = typeof body.modVersion === 'string' ? body.modVersion.slice(0, 16) : null

  if (!DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty' })
  }
  if (!playerName || playerName.length > 32) {
    return res.status(400).json({ error: 'Player name required (max 32 chars)' })
  }
  if (!Number.isFinite(score) || score < 0 || score > 99_999_999) {
    return res.status(400).json({ error: 'Invalid score' })
  }

  try {
    if (!mapId) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      const artist = typeof body.artist === 'string' ? body.artist.trim() : ''
      const charter = typeof body.charter === 'string' ? body.charter.trim() : ''
      if (!title) {
        return res.status(400).json({ error: 'mapId or title required' })
      }

      const lookup = await fetch(
        `${supabaseUrl}/rest/v1/rpc/lookup_map_id`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_title: title,
            p_artist: artist,
            p_charter: charter,
          }),
        },
      )
      if (!lookup.ok) {
        return res.status(502).json({ error: 'Map lookup failed' })
      }
      mapId = await lookup.json()
      if (!mapId) {
        return res.status(404).json({ error: 'Map not found on Indies-DB' })
      }
    }

    const submit = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_score`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_map_id: mapId,
        p_player_name: playerName,
        p_difficulty: difficulty,
        p_score: Math.round(score),
        p_accuracy: Number.isFinite(accuracy) ? accuracy : null,
        p_max_combo: Number.isFinite(maxCombo) ? Math.round(maxCombo) : null,
        p_mod_version: modVersion,
      }),
    })

    if (!submit.ok) {
      const errText = await submit.text()
      return res.status(submit.status).json({ error: errText || 'Submit failed' })
    }

    const scoreId = await submit.json()
    return res.status(200).json({
      ok: true,
      scoreId,
      mapId,
      url: `https://indies-db.vercel.app/maps/${mapId}`,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}