/** @param {import('@vercel/node').VercelRequest} req */
/** @param {import('@vercel/node').VercelResponse} res */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  const rawId = typeof req.query.id === 'string' ? req.query.id : null
  const id = rawId && UUID_RE.test(rawId) ? rawId : null
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'indies-db.vercel.app'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const siteOrigin = `${proto}://${host}`

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  let title = 'Indies-DB'
  let description = 'Community maps for Smash Drums — browse and download custom .indies charts.'
  let image = `${siteOrigin}/og-default.svg`
  let pageUrl = siteOrigin

  if (id && supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/maps?select=title,artist,charter,cover_path,difficulties&id=eq.${id}&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      )
      const rows = await r.json()
      const map = Array.isArray(rows) ? rows[0] : null
      if (map) {
        title = `${map.title} — ${map.artist}`
        description = `Chart by ${map.charter} · Indies-DB`
        pageUrl = `${siteOrigin}/maps/${id}`
        if (map.cover_path) {
          image = `${supabaseUrl}/storage/v1/object/public/indies/${map.cover_path}`
        }
      }
    } catch {
      /* fall back to defaults */
    }
  }

  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Indies-DB" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
</head>
<body>
  <p><a href="${esc(pageUrl)}">${esc(title)}</a></p>
</body>
</html>`)
}