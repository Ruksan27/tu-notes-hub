export function slugify(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns a clean SEO project URL slug.
 * Example: "Hotel Management System" => "hotel-management-system"
 */
export function getProjectSlug(p: { id: string; title: string }): string {
  const titleSlug = slugify(p.title)
  return titleSlug || p.id
}

/**
 * Returns a clean SEO note URL slug.
 * Example: "Computer Graphics Complete Notes" => "computer-graphics-complete-notes"
 */
export function getNoteSlug(note: { id: string; title: string }): string {
  const titleSlug = slugify(note.title)
  return titleSlug || note.id
}

/**
 * Returns a clean SEO question paper URL slug without course code prefixes or UUIDs.
 * Example: Computer Graphics + 2021 + BOARD_EXAM => "computer-graphics-2021-board-exam-question-paper"
 */
export function getPaperSlug(paper: { id: string; year?: number; examType?: string; title?: string; subject?: { title?: string; code?: string } }): string {
  let titleStr = paper.title || ''
  if (!titleStr) {
    const subTitle = paper.subject?.title ? `${paper.subject.title} ` : ''
    const yr = paper.year ? `${paper.year} ` : ''
    const type = paper.examType ? `${paper.examType.replace(/_/g, ' ')} ` : ''
    titleStr = `${subTitle}${yr}${type}question paper`.trim()
  }
  const titleSlug = slugify(titleStr)
  return titleSlug || paper.id
}

/**
 * Extracts UUID from a string if present.
 */
export function extractProjectId(slugOrId: string): string {
  if (!slugOrId) return ''
  const uuidMatch = slugOrId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (uuidMatch) {
    return uuidMatch[1]
  }
  return slugOrId
}
