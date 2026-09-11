export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function toSeoSlug(title: string): string {
  if (!title) return ''
  const cleaned = title
    .replace(/\s*\(Old Syllabus\)/gi, '')
    .replace(/\s*\(New Syllabus\)/gi, '')
    .replace(/\s*\(Old\)/gi, '')
    .replace(/\s*\(New\)/gi, '')
    .trim()

  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractIdFromSlug(slugOrId: string): string {
  if (!slugOrId) return ''
  const uuidMatch = slugOrId.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (uuidMatch?.[1]) return uuidMatch[1]
  return slugOrId
}

export function fixCloudinaryUrl(url: string | null | undefined): string {
  if (!url) return ''
  let clean = url.trim()
  if (clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://')
  }
  // Convert Cloudinary raw PDF/image URLs to image URLs (raw URLs return HTTP 401 on Cloudinary CDN)
  if (clean.includes('res.cloudinary.com') && clean.includes('/raw/upload/')) {
    const pathNoQuery = clean.split('?')[0]
    const ext = pathNoQuery.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      clean = clean.replace('/raw/upload/', '/image/upload/')
    }
  }
  return clean
}
