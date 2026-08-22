/**
 * Public maps API for Smash Indies (Quest headset app) and other clients.
 * GET /api/maps?sort=newest|downloads&q=&limit=50
 * GET /api/maps?id=<uuid>
 */
/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function storagePublicUrl(supabaseUrl, filePath) {
  if (!filePath) return null
  const base = supabaseUrl.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/indies/${filePath}`
}

function enrich(row, supabaseUrl) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    charter: row.charter,
    bpm_est: row.bpm_est,
    difficulties: row.difficulties,
    explicit: Boolean(row.explicit),
    downloads: row.downloads ?? 0,
    created_at: row.created_at,
    file_path: row.file_path,
    cover_path: row.cover_path,
    file_url: storagePublicUrl(supabaseUrl, row.file_path),
    cover_url: storagePublicUrl(supabaseUrl, row.cover_path),
  }
}

export default async function handler(req, res) {
  cors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Database not configured' })
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : ''
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const sort = req.query.sort === 'downloads' ? 'downloads' : 'newest'
  let limit = Number(req.query.limit)
  if (!Number.isFinite(limit) || limit < 1) limit = 50
  if (limit > 100) limit = 100

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  }

  try {
    if (id) {
      if (!UUID_RE.test(id)) {
        return res.status(400).json({ error: 'Invalid id' })
      }
      const url = `${supabaseUrl}/rest/v1/maps?id=eq.${encodeURIComponent(id)}&select=*`
      const r = await fetch(url, { headers })
      if (!r.ok) {
        const text = await r.text()
        return res.status(502).json({ error: 'Upstream error', detail: text.slice(0, 200) })
      }
      const rows = await r.json()
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: 'Map not found' })
      }
      return res.status(200).json({ map: enrich(rows[0], supabaseUrl) })
    }

    const orderCol = sort === 'downloads' ? 'downloads' : 'created_at'
    const params = new URLSearchParams()
    params.set('select', '*')
    params.set('order', `${orderCol}.desc`)
    params.set('limit', String(limit))
    if (q) {
      // PostgREST or-filter; % is wildcard for ilike
      params.set(
        'or',
        `(title.ilike.%${q}%,artist.ilike.%${q}%,charter.ilike.%${q}%)`,
      )
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/maps?${params.toString()}`, { headers })
    if (!r.ok) {
      const text = await r.text()
      return res.status(502).json({ error: 'Upstream error', detail: text.slice(0, 200) })
    }
    const rows = await r.json()
    const maps = Array.isArray(rows) ? rows.map((row) => enrich(row, supabaseUrl)) : []
    return res.status(200).json({ maps, sort, count: maps.length })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
