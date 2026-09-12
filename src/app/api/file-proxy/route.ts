// src/app/api/file-proxy/route.ts
// Server-side proxy: fetches files from Cloudinary and streams them through our domain.
// This bypasses browser CORS, CSP, and X-Frame-Options restrictions completely.
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Parse CLOUDINARY_ACCOUNTS (the same format used by /api/upload/signature)
// Fall back to the individual env vars if the JSON array is absent.
// ---------------------------------------------------------------------------
// Store all parsed accounts so we can match the cloud_name from the URL
let cloudinaryAccounts: Array<{ cloud_name: string; api_key: string; api_secret: string }> = []
let defaultAccount: { cloud_name: string; api_key: string; api_secret: string } | null = null

try {
  const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
  const accounts = JSON.parse(accountsStr)
  if (Array.isArray(accounts) && accounts.length > 0) {
    cloudinaryAccounts = accounts
    defaultAccount = accounts[0]
  }
} catch {
  // ignore parse errors
}

if (!defaultAccount && process.env.CLOUDINARY_API_SECRET) {
  defaultAccount = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET,
  }
  cloudinaryAccounts = [defaultAccount]
}

if (cloudinaryAccounts.length === 0) {
  console.warn(
    '[FILE_PROXY] No Cloudinary credentials found. Set CLOUDINARY_ACCOUNTS or ' +
    'CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in .env.local'
  )
}

/**
 * Try to generate a signed Cloudinary URL for the given URL.
 * Works for BOTH /raw/upload/ and /image/upload/ paths.
 * Falls back to the original URL if signing fails or credentials are missing.
 */
function trySignCloudinaryUrl(rawUrl: string): string {
  // Already signed – nothing to do
  if (/\/s--/.test(rawUrl)) return rawUrl

  if (cloudinaryAccounts.length === 0) return rawUrl

  const isRaw = rawUrl.includes('/raw/upload/')
  const isImage = rawUrl.includes('/image/upload/')
  if (!isRaw && !isImage) return rawUrl

  try {
    // Extract cloud_name from URL (e.g. https://res.cloudinary.com/<cloud_name>/...)
    const match = rawUrl.match(/res\.cloudinary\.com\/([^/]+)\//)
    const urlCloudName = match ? match[1] : ''

    // Find the matching account, or fall back to default
    const account = cloudinaryAccounts.find(a => a.cloud_name === urlCloudName) || defaultAccount
    if (!account?.api_secret) return rawUrl

    // Configure the SDK with the correct account credentials for this URL
    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
      secure: true,
    })

    const uploadSegment = isRaw ? '/raw/upload/' : '/image/upload/'
    const afterUpload = rawUrl.split(uploadSegment)[1]
    if (!afterUpload) return rawUrl

    // Strip query-string
    const withoutQuery = afterUpload.split('?')[0]
    
    // Extract version if present (e.g. v1789117166)
    const versionMatch = withoutQuery.match(/^v(\d+)\//)
    const version = versionMatch ? versionMatch[1] : undefined
    
    // Strip leading version prefix for the public ID
    const publicId = withoutQuery.replace(/^v\d+\//, '')

    // Assets uploaded without explicit type are type:'upload' (public)
    const options: any = {
      resource_type: isRaw ? 'raw' : 'image',
      type: 'upload',
      sign_url: true,
      secure: true,
    }
    
    if (version) {
      options.version = version
    }

    const signedUrl: string = cloudinary.url(publicId, options)

    console.log('[FILE_PROXY_SIGN] signed URL:', signedUrl)
    return signedUrl
  } catch (e) {
    console.error('[FILE_PROXY_SIGN] failed, falling back to unsigned URL:', e)
    return rawUrl
  }
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
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream'

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }

    if (filename) {
      const cleanName = decodeURIComponent(filename).replace(/[^a-zA-Z0-9_\-.]/g, '_')
      headers['Content-Disposition'] =
        `attachment; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
    }

    // Stream directly – avoids loading the full PDF into memory
    return new NextResponse(response.body, { status: 200, headers })
  } catch (error) {
    console.error('[FILE_PROXY]', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
