import { next, rewrite } from '@vercel/functions'

const BOT_RE =
  /bot|discord|slack|twitter|facebook|linkedin|whatsapp|telegram|embed|preview|applebot|vkshare|redditbot/i

export const config = {
  matcher: ['/', '/maps/:id'],
}

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!BOT_RE.test(ua)) return next()

  const url = new URL(request.url)

  if (url.pathname.startsWith('/maps/')) {
    const id = url.pathname.split('/')[2]
    if (id) {
      const dest = new URL('/api/og', url.origin)
      dest.searchParams.set('id', id)
      return rewrite(dest)
    }
  }

  if (url.pathname === '/') {
    return rewrite(new URL('/api/og', url.origin))
  }

  return next()
}