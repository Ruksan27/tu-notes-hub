export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function toSeoSlug(title: string): string {
  if (!title) return ''
  return title
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
