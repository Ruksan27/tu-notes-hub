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
 * Returns a clean SEO note URL slug combined with Faculty + Semester + Subject + Note Title.
 * Example: BCA + 5th Semester + MIS & E-Business + photo => "bca-5th-semester-mis-e-business-photo-notes"
 */
export function getNoteSlug(note: {
  id: string
  title: string
  subject?: {
    title?: string
    code?: string
    semester?: {
      order?: number
      facultyId?: string
      faculty?: { id?: string; systemType?: string }
    }
  }
  facultyId?: string
  semesterOrder?: number
}): string {
  const facId = note.facultyId || note.subject?.semester?.facultyId || note.subject?.semester?.faculty?.id || ''
  const semOrder = note.semesterOrder || note.subject?.semester?.order
  const sysType = note.subject?.semester?.faculty?.systemType

  let periodKeyword = ''
  if (semOrder) {
    const ord = semOrder === 1 ? '1st' : semOrder === 2 ? '2nd' : semOrder === 3 ? '3rd' : `${semOrder}th`
    const unit = sysType === 'YEARLY' ? 'year' : 'semester'
    periodKeyword = `${ord}-${unit}`
  }

  const facKeyword = facId ? `${facId} ` : ''
  const periodStr = periodKeyword ? `${periodKeyword} ` : ''
  const subTitle = note.subject?.title ? `${note.subject.title} ` : ''
  const noteTitle = note.title || 'study notes'

  let combined = `${facKeyword}${periodStr}${subTitle}${noteTitle}`
  if (!combined.toLowerCase().includes('note')) {
    combined += ' notes'
  }
  const titleSlug = slugify(combined)
  return titleSlug || note.id
}

/**
 * Returns a clean SEO question paper URL slug with Faculty + Semester + Subject + Year + Exam.
 * Example: BCA + 5th Semester + Computer Graphics + 2021 + BOARD_EXAM => "bca-5th-semester-computer-graphics-2021-board-exam-question-paper"
 */
export function getPaperSlug(paper: {
  id: string
  year?: number
  examType?: string
  title?: string
  subject?: {
    title?: string
    code?: string
    semester?: {
      order?: number
      facultyId?: string
      faculty?: { id?: string; systemType?: string }
    }
  }
  facultyId?: string
  semesterOrder?: number
}): string {
  let titleStr = paper.title || ''
  if (!titleStr) {
    const facId = paper.facultyId || paper.subject?.semester?.facultyId || paper.subject?.semester?.faculty?.id || ''
    const semOrder = paper.semesterOrder || paper.subject?.semester?.order
    const sysType = paper.subject?.semester?.faculty?.systemType

    let periodKeyword = ''
    if (semOrder) {
      const ord = semOrder === 1 ? '1st' : semOrder === 2 ? '2nd' : semOrder === 3 ? '3rd' : `${semOrder}th`
      const unit = sysType === 'YEARLY' ? 'year' : 'semester'
      periodKeyword = `${ord}-${unit}`
    }

    const facKeyword = facId ? `${facId} ` : ''
    const periodStr = periodKeyword ? `${periodKeyword} ` : ''
    const subTitle = paper.subject?.title ? `${paper.subject.title} ` : ''
    const yr = paper.year ? `${paper.year} ` : ''
    const type = paper.examType ? `${paper.examType.replace(/_/g, ' ')} ` : ''

    titleStr = `${facKeyword}${periodStr}${subTitle}${yr}${type}question paper`.trim()
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
