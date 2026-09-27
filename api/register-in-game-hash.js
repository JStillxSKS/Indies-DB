/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */
const HASH_RE = /^[A-Za-z0-9_-]{4,32}$/

/** Lowercase, flatten dash characters, and collapse spacing so replies match stored titles. */
export function norm(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*([|/:])\s*/g, ' $1 ')
    .replace(/\s*-\s*/g, ' - ')
    .trim()
}

function tokens(value) {
  return norm(value).split(/[^a-z0-9.]+/).filter(Boolean)
}

function sameTokens(a, b) {
  if (a.length !== b.length || a.length === 0) return false
  return [...a].sort().join('\0') === [...b].sort().join('\0')
}

/** Words that identify a map. If the artist is already inside the title, don't count it twice. */
function identityTokens(title, artist) {
  const nt = norm(title)
  const na = norm(artist)
  if (na && nt.includes(na)) return tokens(nt)
  if (nt && na.includes(nt)) return tokens(na)
  return tokens(`${nt} ${na}`)
}

/**
 * Pick the Indies-DB map a Discord reply was aiming at.
 * Returns { map, score } or null. Score >= 86 is safe to register.
 */
export function findBestMap(title, artist, maps) {
  const ut = norm(title)
  const ua = norm(artist)
  if (!ut && !ua) return null

  let best = null
  let second = 0
  for (const map of maps) {
    const mt = norm(map.title)
    const ma = norm(map.artist)
    if (!mt) continue

    let score = 0
    if (mt === ut && ma === ua) score = 100
    else if (mt === ut && (!ua || ma === ua || ma.includes(ua) || ua.includes(ma))) score = 92
    else if (
      ua &&
      (mt === norm(`${ua} - ${ut}`) ||
        mt === norm(`${ut} - ${ua}`) ||
        mt === norm(`${ua} ${ut}`) ||
        mt === norm(`${ut} ${ua}`)) &&
      (!ma || ma === ua || ma === ut || mt.includes(ma))
    ) {
      score = 90
    } else if (sameTokens(identityTokens(map.title, map.artist), identityTokens(title, artist))) {
      score = 86
    } else {
      const mapId = identityTokens(map.title, map.artist)
      const userId = identityTokens(title, artist)
      const inter = mapId.filter((t) => userId.includes(t))
      if (inter.length && userId.length) {
        score = Math.round((40 * inter.length) / Math.max(mapId.length, userId.length))
      }
    }

    if (!best || score > best.score) {
      second = best ? best.score : 0
      best = { map, score }
    } else if (score > second) {
      second = score
    }
  }

  if (!best || best.score < 86) return { map: null, score: best?.score || 0, suggestions: topSuggestions(title, artist, maps) }
  if (second >= best.score) return { map: null, score: best.score, suggestions: topSuggestions(title, artist, maps) }
  return { map: best.map, score: best.score, suggestions: [] }
}

function topSuggestions(title, artist, maps) {
  const ranked = maps
    .map((map) => {
      const mapId = identityTokens(map.title, map.artist)
      const userId = identityTokens(title, artist)
      const inter = mapId.filter((t) => userId.includes(t))
      const score = userId.length
        ? inter.length / Math.max(mapId.length, userId.length)
        : 0
      return { map, score }
    })
    .filter((row) => row.score > 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  return ranked.map((row) => `${row.map.title} — ${row.map.artist}`)
}

function readableError(text) {
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed.message === 'string' && parsed.message) return parsed.message
    if (parsed && typeof parsed.error === 'string' && parsed.error) return parsed.error
  } catch {
    /* body was already plain text */
  }
  return text || 'Register failed'
}

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

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  try {
    const listed = await fetch(
      `${supabaseUrl}/rest/v1/maps?select=id,title,artist&limit=200`,
      { headers },
    )
    if (!listed.ok) {
      const errText = await listed.text()
      return res.status(502).json({ error: readableError(errText) })
    }
    const maps = await listed.json()
    const found = findBestMap(title, artist, Array.isArray(maps) ? maps : [])
    if (!found.map) {
      const closest = found.suggestions.length
        ? ` Closest on Indies-DB: ${found.suggestions.join('; ')}.`
        : ''
      return res.status(404).json({
        error: `No map matches "${title}"${artist ? ` by "${artist}"` : ''}.${closest}`,
      })
    }

    const register = await fetch(`${supabaseUrl}/rest/v1/rpc/register_in_game_hash`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        p_hash: hash,
        p_title: found.map.title,
        p_artist: found.map.artist,
      }),
    })

    if (!register.ok) {
      const errText = await register.text()
      return res.status(register.status).json({ error: readableError(errText) })
    }

    const result = await register.json()
    return res.status(200).json({
      ok: true,
      mapId: result?.map_id ?? found.map.id,
      title: result?.title ?? found.map.title,
      artist: result?.artist ?? found.map.artist,
      hash,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' })
  }
}
