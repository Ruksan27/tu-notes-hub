// src/app/api/file-proxy/route.ts
// Server-side proxy: fetches files from Cloudinary and streams them through our domain.
// This bypasses browser CORS, CSP, and X-Frame-Options restrictions completely.
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

function getCloudinaryAccounts() {
  let accounts: Array<{ cloud_name: string; api_key: string; api_secret: string }> = []
  try {
    const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
    const parsed = JSON.parse(accountsStr)
    if (Array.isArray(parsed) && parsed.length > 0) {
      accounts = parsed
    }
  } catch {}

  if (accounts.length === 0 && process.env.CLOUDINARY_API_SECRET) {
    accounts = [{
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }]
  }
  return accounts
}

/**
 * Try to generate a signed Cloudinary URL for the given URL.
 * Works for BOTH /raw/upload/ and /image/upload/ paths.
 * Tries 'authenticated' delivery type first, then 'upload' (public).
 * Falls back to the original URL if signing fails or credentials are missing.
 */
import { signCloudinaryUrl } from '@/lib/cloudinary'

function trySignCloudinaryUrl(rawUrl: string): string {
  return signCloudinaryUrl(rawUrl)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Security: only allow Cloudinary URLs
  let safeUrl = url
  if (
    !safeUrl.startsWith('https://res.cloudinary.com') &&
    !safeUrl.startsWith('http://res.cloudinary.com')
  ) {
    return NextResponse.json({ error: 'Only Cloudinary URLs are allowed' }, { status: 403 })
  }

  // Force HTTPS
  safeUrl = safeUrl.replace(/^http:\/\//, 'https://')

  // Sign PDF URLs (handles both /raw/upload/ and /image/upload/ PDFs)
  const isPdf =
    safeUrl.includes('/raw/upload/') ||
    safeUrl.toLowerCase().includes('.pdf')

  const fetchUrl = isPdf ? trySignCloudinaryUrl(safeUrl) : safeUrl

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    })

    if (!response.ok) {
      console.error('[FILE_PROXY_ERROR]', safeUrl, response.status, '| fetchUrl:', fetchUrl)
      return NextResponse.json(
        { error: `Failed to fetch file (${response.status})` },
        { status: response.status }
      )
    }

    const filename = searchParams.get('filename')
    const isDownload = searchParams.get('download') === 'true'
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }

    if (filename) {
      const cleanName = decodeURIComponent(filename).replace(/[^a-zA-Z0-9_\-.]/g, '_')
      const disposition = isDownload ? 'attachment' : 'inline'
      headers['Content-Disposition'] =
        `${disposition}; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
    } else {
      headers['Content-Disposition'] = 'inline'
    }

    // Stream directly – avoids loading the full PDF into memory
    return new NextResponse(response.body, { status: 200, headers })
  } catch (error) {
    console.error('[FILE_PROXY]', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
