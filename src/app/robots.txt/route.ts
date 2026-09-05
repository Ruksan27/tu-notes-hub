export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tunoteshub.com'

  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /dashboard

Sitemap: ${baseUrl}/sitemap.xml
`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
