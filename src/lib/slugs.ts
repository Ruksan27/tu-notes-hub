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
 * Returns clean semester path segment.
 * Example: ("bca", 5, "SEMESTER") => "/faculty/bca/5th-semester"
 */
export function getSemesterPath(facultyId?: string, semesterOrder?: number, systemType?: string): string {
  if (!facultyId || !semesterOrder) return ''
  const ord = semesterOrder === 1 ? '1st' : semesterOrder === 2 ? '2nd' : semesterOrder === 3 ? '3rd' : `${semesterOrder}th`
  const unit = systemType === 'YEARLY' ? 'year' : 'semester'
  return `/faculty/${facultyId}/${ord}-${unit}`
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
 * Returns a clean SEO note URL slug combined with Subject + Note Title.
 * Example: MIS & E-Business + photo => "mis-e-business-photo-notes"
 */
export function getNoteSlug(note: {
  id: string
  title: string
  subject?: {
    title?: string
    code?: string
  }
}): string {
  const subTitle = note.subject?.title ? `${note.subject.title} ` : ''
  const noteTitle = note.title || 'study notes'

  let combined = `${subTitle}${noteTitle}`
  if (!combined.toLowerCase().includes('note')) {
    combined += ' notes'
  }
  const titleSlug = slugify(combined)
  return titleSlug || note.id
}

/**
 * Returns a clean SEO question paper URL slug with Subject + Year + Exam.
 * Example: Computer Graphics + 2021 + BOARD_EXAM => "computer-graphics-2021-board-exam-question-paper"
 */
export function getPaperSlug(paper: {
  id: string
  year?: number
  examType?: string
  title?: string
  subject?: {
    title?: string
    code?: string
  }
}): string {
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
