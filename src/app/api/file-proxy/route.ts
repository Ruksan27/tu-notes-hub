// src/app/api/file-proxy/route.ts
// Server-side proxy: fetches files from Cloudinary and streams them through our domain.
// This bypasses browser CORS, CSP, and X-Frame-Options restrictions completely.
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only allow Cloudinary URLs (security check)
  let safeUrl = url
  if (!safeUrl.startsWith('https://res.cloudinary.com') && !safeUrl.startsWith('http://res.cloudinary.com')) {
    return NextResponse.json({ error: 'Only Cloudinary URLs are allowed' }, { status: 403 })
  }

  // Force https
  safeUrl = safeUrl.replace('http://', 'https://')

  try {
    const response = await fetch(safeUrl, {
      headers: {
        'User-Agent': 'TUNotesHub/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        // Cache for 1 hour
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': body.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[FILE_PROXY]', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
