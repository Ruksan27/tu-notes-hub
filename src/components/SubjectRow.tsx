'use client'
// src/components/SubjectRow.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { getNoteSlug, getPaperSlug, getSemesterPath, slugify } from '@/lib/slugs'
import SolutionBookList from '@/components/SolutionBookList'

interface Note {
  id: string
  title: string
  description: string | null
  cloudinaryUrl: string
  fileSize: string | null
  noteType: string
  isPremium: boolean
  downloadCount: number
}

interface PastPaper {
  id: string
  year: number
  examType: string
  cloudinaryUrl: string
}

interface CheatsheetFile {
  url: string
  name: string
  size?: string
  type?: string
}

interface Cheatsheet {
  id: string
  title: string
  content?: string | null
  files?: CheatsheetFile[] | any | null
}

interface MCQ {
  id: string
  question: string
  options: string[]
  correctOption: number
  explanation: string | null
  year?: number | null
  examCategory?: string | null
}

interface SolutionBook {
  id: string
  title: string
  description?: string | null
  cloudinaryUrl: string
  fileSize?: string | null
  isPremium: boolean
  author?: string | null
}

interface Subject {
  id: string
  title: string
  code: string
  notes: Note[]
  pastPapers: PastPaper[]
  cheatsheets: Cheatsheet[]
  solutionBooks?: SolutionBook[]
  mcqs?: MCQ[]
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const cardItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 26,
    },
  },
}

export default function SubjectRow({
  subject,
  facultyId,
  semesterOrder,
  systemType,
}: {
  subject: Subject
  facultyId?: string
  semesterOrder?: number
  systemType?: string
}) {
  const [activeTab, setActiveTab] = useState<'notes' | 'labWork' | 'projectWork' | 'project' | 'pastPapers' | 'guide' | 'cheatsheets' | 'solutionBooks' | 'mcqs' | 'syllabus' | null>(null)
  const [isEliteAI, setIsEliteAI] = useState(false)
  const [selectedCheatsheet, setSelectedCheatsheet] = useState<Cheatsheet | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const u = JSON.parse(stored)
        setIsEliteAI(u?.packageType === 'ELITE_AI' || u?.role === 'ADMIN' || u?.role === 'CHILD_ADMIN')
      }
    } catch { }
  }, [])

  const semPath = getSemesterPath(facultyId, semesterOrder, systemType)

  const getResourceLink = (itemTitle: string, category: string, fallbackSlug: string) => {
    if (semPath) {
      const subSlug = slugify(subject.title) || slugify(subject.code)
      let rawItemSlug = slugify(itemTitle) || 'resource'
      if (['syllabus', 'notes', 'note', 'cheatsheet', 'mcq', 'books', 'lab-work'].includes(rawItemSlug)) {
        const codePrefix = slugify(subject.code || subject.title)
        rawItemSlug = `${codePrefix}-${rawItemSlug}`
      }
      const itemSlug = rawItemSlug.length > 50
        ? rawItemSlug.substring(0, rawItemSlug.lastIndexOf('-', 50)) || rawItemSlug.substring(0, 50)
        : rawItemSlug

      // SEO Mappings for URL category segment
      let seoCategory = category
      if (category === 'papers') {
        seoCategory = 'question-paper'
      } else if (category === 'guides') {
        seoCategory = 'books'
      }

      return `${semPath}/${subSlug}/${seoCategory}/${itemSlug}`
    }
    return `/${category === 'papers' ? 'paper' : 'note'}/${fallbackSlug}`
  }

  // Categorize notes
  const notes = subject.notes.filter(n => !['PROJECT_WORK', 'PROJECT', 'GUIDE', 'LAB_WORK', 'SYLLABUS'].includes(n.noteType))
  const labWorks = subject.notes.filter(n => n.noteType === 'LAB_WORK')
  const projectWorks = subject.notes.filter(n => n.noteType === 'PROJECT_WORK')
  const projects = subject.notes.filter(n => n.noteType === 'PROJECT')
  const guides = subject.notes.filter(n => n.noteType === 'GUIDE')
  const syllabusFiles = subject.notes.filter(n => n.noteType === 'SYLLABUS')
  const pastPapers = subject.pastPapers
  const cheatsheets = subject.cheatsheets
  const solutionBooks = subject.solutionBooks || []
  const mcqs = subject.mcqs || []
  const mcqSetsCount = new Set(mcqs.map((m: any) => `${m.year}-${m.examCategory}`)).size
  const subSlug = slugify(subject.title) || slugify(subject.code)
  const mcqUrl = semPath ? `${semPath}/${subSlug}/mcq` : `/mcq/${subject.id}`

  const toggleTab = (tabName: 'notes' | 'labWork' | 'projectWork' | 'project' | 'pastPapers' | 'guide' | 'cheatsheets' | 'solutionBooks' | 'mcqs' | 'syllabus') => {
    if (activeTab === tabName) {
      setActiveTab(null)
    } else {
      setActiveTab(tabName)
    }
  }

  const getPillStyle = (tabName: string, count: number) => {
    const isActive = activeTab === tabName
    const hasItems = count > 0

    return {
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: hasItems ? 'pointer' : 'not-allowed',
      opacity: hasItems ? 1 : 0.4,
      border: isActive ? '1px solid var(--clr-primary)' : '1px solid var(--clr-border)',
      background: isActive
        ? 'var(--grad-brand)'
        : hasItems
          ? 'rgba(255, 255, 255, 0.03)'
          : 'transparent',
      color: isActive ? '#fff' : 'var(--clr-text-2)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
    }
  }

  const handleRowClick = () => {
    if (activeTab) {
      setActiveTab(null)
      return
    }
    if (notes.length > 0) setActiveTab('notes')
    else if (pastPapers.length > 0) setActiveTab('pastPapers')
    else if (labWorks.length > 0) setActiveTab('labWork')
    else if (projectWorks.length > 0) setActiveTab('projectWork')
    else if (projects.length > 0) setActiveTab('project')
    else if (guides.length > 0) setActiveTab('guide')
    else if (syllabusFiles.length > 0) setActiveTab('syllabus')
    else if (cheatsheets.length > 0) setActiveTab('cheatsheets')
    else if (mcqSetsCount > 0) setActiveTab('mcqs')
  }

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="glass-card subject-card"
      style={{
        padding: '0',
        overflow: 'hidden',
        borderLeft: activeTab ? '4px solid var(--clr-primary-h)' : '4px solid transparent',
        borderColor: activeTab ? 'rgba(99,102,241,0.35)' : 'var(--clr-border)',
        boxShadow: activeTab ? '0 8px 32px rgba(99, 102, 241, 0.12)' : 'var(--shadow-sm)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* Row Header */}
      <div
        onClick={handleRowClick}
        className="subject-row-header"
        style={{
          background: activeTab ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.015)',
          cursor: 'pointer',
          transition: 'background 0.25s ease',
        }}
      >
        <div className="subject-row-info">
          {/* Subject Info */}
          <div className="subject-title-wrapper">
            <span
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--clr-accent)',
                fontWeight: 700,
                fontSize: '11px',
                fontFamily: 'var(--font-display)',
                whiteSpace: 'nowrap',
              }}
            >
              {subject.code}
            </span>
            <h3 className="subject-title">
              {subject.title
                .replace(/\s*\(Old Syllabus\)/gi, '')
                .replace(/\s*\(New Syllabus\)/gi, '')
                .replace(/\s*\(Old\)/gi, '')
                .replace(/\s*\(New\)/gi, '')}
            </h3>
          </div>

          {/* Expand Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', height: '28px' }}>
            <motion.span
              animate={{ rotate: activeTab ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              style={{
                fontSize: '12px',
                color: activeTab ? 'var(--clr-accent-h)' : 'var(--clr-text-3)',
                display: 'inline-block',
              }}
            >
              ▼
            </motion.span>
          </div>
        </div>

        {/* Action Toggles */}
        {(notes.length > 0 || labWorks.length > 0 || projectWorks.length > 0 || projects.length > 0 || pastPapers.length > 0 || guides.length > 0 || syllabusFiles.length > 0 || solutionBooks.length > 0 || cheatsheets.length > 0 || mcqSetsCount > 0) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            {notes.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/notes` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('notes') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('notes', notes.length)}>
                  📄 Notes ({notes.length})
                </span>
              </Link>
            )}

            {labWorks.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/lab-work` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('labWork') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('labWork', labWorks.length)}>
                  🧪 Lab ({labWorks.length})
                </span>
              </Link>
            )}

            {projectWorks.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/project-work` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('projectWork') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('projectWork', projectWorks.length)}>
                  📁 Proj Work ({projectWorks.length})
                </span>
              </Link>
            )}

            {projects.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/project` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('project') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('project', projects.length)}>
                  💻 Project ({projects.length})
                </span>
              </Link>
            )}

            {pastPapers.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/question-paper` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('pastPapers') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('pastPapers', pastPapers.length)}>
                  📝 Papers ({pastPapers.length})
                </span>
              </Link>
            )}

            {guides.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/books` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('guide') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('guide', guides.length)}>
                  📘 Books ({guides.length})
                </span>
              </Link>
            )}

            {syllabusFiles.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/syllabus` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('syllabus') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={{
                  ...getPillStyle('syllabus', syllabusFiles.length),
                  ...(activeTab === 'syllabus' ? {} : {
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                  }),
                }}>
                  📋 Syllabus ({syllabusFiles.length})
                </span>
              </Link>
            )}

            {solutionBooks.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/solution-book` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('solutionBooks') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('solutionBooks', solutionBooks.length)}>
                  📘 Solution ({solutionBooks.length})
                </span>
              </Link>
            )}

            {cheatsheets.length > 0 && (
              <Link
                href={semPath ? `${semPath}/${subSlug}/cheatsheet` : '#'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTab('cheatsheets') }}
                style={{ textDecoration: 'none' }}
              >
                <span style={getPillStyle('cheatsheets', cheatsheets.length)}>
                  📋 Cheatsheet ({cheatsheets.length})
                </span>
              </Link>
            )}

            {mcqSetsCount > 0 && (
              <Link
                href={mcqUrl}
                onClick={e => e.stopPropagation()}
                style={{ textDecoration: 'none', pointerEvents: 'auto', zIndex: 10, position: 'relative' }}
              >
                <span style={{
                  ...getPillStyle('mcqs', mcqSetsCount),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activeTab === 'mcqs'
                    ? 'var(--grad-brand)'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: activeTab === 'mcqs' ? '#fff' : '#a5b4fc',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}>
                  ✅ MCQs ({mcqSetsCount})

                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Accordion Panel with Premium Motion Animation */}
      <AnimatePresence initial={false}>
        {activeTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 350, damping: 32 },
              opacity: { duration: 0.2 },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '22px 24px',
                borderTop: '1px solid var(--clr-border)',
                background: 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              }}
            >
              {/* Notes List */}
              {activeTab === 'notes' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📄 Study Notes</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {notes.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'notes', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.03, y: -2, boxShadow: '0 8px 24px rgba(99,102,241,0.2)' }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)', flexWrap: 'wrap', gap: '4px' }}>
                            <span>{note.noteType.replace('_', ' ')} ({note.fileSize || 'N/A'})</span>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {(note as any).isFromOldSyllabus && <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>OLD SYLLABUS</span>}
                              {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Lab Work List */}
              {activeTab === 'labWork' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>🧪 Lab Works & Reports</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {labWorks.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'lab-work', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>{note.fileSize || 'N/A'}</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Project Works List */}
              {activeTab === 'projectWork' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📁 Project Works</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {projectWorks.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'project-work', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>{note.fileSize || 'N/A'}</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Projects List */}
              {activeTab === 'project' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>💻 Projects</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {projects.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'projects', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>{note.fileSize || 'N/A'}</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Past Papers List */}
              {activeTab === 'pastPapers' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📝 Question Papers</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="past-paper-grid">
                    {pastPapers.map(pp => (
                      <Link key={pp.id} href={getResourceLink(`${pp.year} ${pp.examType.replace('_', ' ')}`, 'papers', getPaperSlug({ ...pp, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.04, y: -3, boxShadow: '0 8px 24px rgba(6,182,212,0.2)' }} whileTap={{ scale: 0.98 }} className="glass-card past-paper-card" style={{ margin: 0, cursor: 'pointer', background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.2)' }}>
                          <p className="past-paper-title">{pp.year} {pp.examType.replace('_', ' ')}</p>
                          {(pp as any).isFromOldSyllabus && (
                            <span className="badge" style={{ fontSize: '9px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                              📜 Old Syllabus
                            </span>
                          )}
                          <span className="past-paper-link">
                            <span className="hide-mobile-text">Download / </span>View Paper →
                          </span>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Guides List */}
              {activeTab === 'guide' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📘 Books & Exam Guides</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {guides.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'guides', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>{note.fileSize || 'N/A'}</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Solution Books List */}
              {activeTab === 'solutionBooks' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📘 Subject Solution Books</h4>
                  <SolutionBookList books={solutionBooks} />
                </div>
              )}

              {/* Syllabus Files */}
              {activeTab === 'syllabus' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📋 Course Syllabus</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {syllabusFiles.map(note => (
                      <Link key={note.id} href={getResourceLink(note.title, 'syllabus', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div
                          variants={cardItemVariants}
                          whileHover={{ scale: 1.03, y: -2, boxShadow: '0 8px 24px rgba(245,158,11,0.2)' }}
                          whileTap={{ scale: 0.98 }}
                          className="glass-card"
                          style={{
                            padding: '16px',
                            margin: 0,
                            cursor: 'pointer',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                          }}
                        >
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{note.title}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>📋 Syllabus {note.fileSize ? `(${note.fileSize})` : ''}</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Cheatsheets List — Elite AI Only */}
              {activeTab === 'cheatsheets' && (
                <div style={{ position: 'relative' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📋 Cheatsheets</h4>

                  {/* Blurred preview cards for non-elite, full interactive cards for elite */}
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', filter: isEliteAI ? 'none' : 'blur(6px)', userSelect: isEliteAI ? 'auto' : 'none', pointerEvents: isEliteAI ? 'auto' : 'none' }}>
                    {cheatsheets.map(cs => (
                      <Link key={cs.id} href={getResourceLink(cs.title, 'cheatsheet', cs.id)} style={{ textDecoration: 'none' }}>
                        <motion.div
                          variants={cardItemVariants}
                          className="glass-card"
                          whileHover={isEliteAI ? { scale: 1.03, y: -2, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' } : {}}
                          whileTap={isEliteAI ? { scale: 0.98 } : {}}
                          style={{
                            padding: '18px',
                            margin: 0,
                            borderRadius: '14px',
                            background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: isEliteAI ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)', opacity: 0.7 }} />

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="badge badge-elite" style={{ fontSize: '9px', padding: '4px 10px', borderRadius: '20px' }}>✨ ELITE AI ONLY</span>
                              {cs.files && Array.isArray(cs.files) && cs.files.length > 0 && (
                                <span style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600 }}>📎 {cs.files.length} File{cs.files.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-text-1)', margin: '0 0 8px', lineHeight: 1.4 }}>{cs.title}</p>
                            {cs.content && (
                              <p style={{
                                fontSize: '12px',
                                color: 'var(--clr-text-2)',
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.5
                              }}>
                                {cs.content}
                              </p>
                            )}
                          </div>

                          <div style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#a5b4fc',
                            fontSize: '12px',
                            fontWeight: 700,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}>
                            📖 Open Cheatsheet →
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </motion.div>

                  {/* Lock Overlay for non-Elite users */}
                  {!isEliteAI && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      gap: '10px',
                      background: 'rgba(9, 11, 22, 0.65)',
                      backdropFilter: 'blur(3px)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}>
                      <div style={{ fontSize: '32px' }}>🔒</div>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Elite AI Plan Required</p>
                      <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', margin: 0, textAlign: 'center', maxWidth: '280px' }}>
                        Cheatsheets are exclusive to Elite AI members. Upgrade to unlock instant access.
                      </p>
                      <Link href="/pricing" style={{ textDecoration: 'none', marginTop: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 700,
                          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                          cursor: 'pointer',
                        }}>
                          🚀 Upgrade to Elite AI
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* MCQs List */}
              {activeTab === 'mcqs' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>✅ MCQ Answers</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    <Link href={mcqUrl} style={{ textDecoration: 'none' }}>
                      <motion.div
                        variants={cardItemVariants}
                        whileHover={{ scale: 1.04, y: -3, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card"
                        style={{ padding: '18px', margin: 0, cursor: 'pointer', borderRadius: '12px', background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
                      >
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                          ✅ View MCQ Answers
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '10px' }}>
                          {mcqs.length} question{mcqs.length !== 1 ? 's' : ''} available
                        </p>
                        <span style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600 }}>View Answers →</span>
                      </motion.div>
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cheatsheet Full Modal */}
      <AnimatePresence>
        {selectedCheatsheet && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setSelectedCheatsheet(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: 'var(--clr-accent)',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      {subject.code}
                    </span>
                    <span className="badge badge-elite" style={{ fontSize: '9px', padding: '3px 8px' }}>
                      ✨ ELITE AI CHEATSHEET
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {selectedCheatsheet.title}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedCheatsheet(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Content text */}
                {selectedCheatsheet.content && (
                  <div>
                    <h5
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#a5b4fc',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '8px',
                      }}
                    >
                      📝 Cheatsheet Content
                    </h5>
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '13px',
                        color: 'var(--clr-text-1)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {selectedCheatsheet.content}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {selectedCheatsheet.files && Array.isArray(selectedCheatsheet.files) && selectedCheatsheet.files.length > 0 && (
                  <div>
                    <h5
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#67e8f9',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '10px',
                      }}
                    >
                      📎 Attached Resource Files ({selectedCheatsheet.files.length})
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                      {selectedCheatsheet.files.map((file: CheatsheetFile, fi: number) => {
                        const isImg = file.url?.match(/\.(jpg|jpeg|png|webp)/i) || file.type?.includes('image')
                        const isPdf = file.url?.endsWith('.pdf') || file.name?.endsWith('.pdf')
                        return (
                          <div
                            key={fi}
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                            }}
                          >
                            {/* Image preview if image */}
                            {isImg && (
                              <div style={{ borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', background: '#000' }}>
                                <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isImg ? '🖼️' : isPdf ? '📄' : '📝'} {file.name || `File ${fi + 1}`}
                              </span>
                              {file.size && <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>{file.size}</span>}
                            </div>

                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                textAlign: 'center',
                              }}
                            >
                              Open / Download ↗
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatExamType(type: string) {
  switch (type) {
    case 'BOARD_EXAM': return '🎓 Board Exam'
    case 'INTERNAL_EXAM': return '🏫 Internal Exam'
    case 'BACK_PAPER': return '🔄 Back Paper'
    default: return type
  }
}

function McqSection({ mcqs, subject }: { mcqs: MCQ[], subject: Subject }) {
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const years = Array.from(new Set(mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
  const categories = Array.from(new Set(mcqs.map(m => m.examCategory).filter(Boolean)))

  const filtered = mcqs.filter(m => {
    if (filterYear !== 'all' && String(m.year) !== filterYear) return false
    if (filterCategory !== 'all' && m.examCategory !== filterCategory) return false
    return true
  })

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = encodeURIComponent(`Practice MCQs — ${subject.title} (${subject.code}) | TU Notes Hub`)

  return (
    <div>
      {/* Resource-style Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(11,60,93,0.95) 0%, rgba(24,40,72,0.97) 100%)',
        borderRadius: '14px',
        padding: '22px 24px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
      }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', borderRadius: '20px', padding: '4px 12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: '#67e8f9', fontWeight: 700, letterSpacing: '0.08em' }}>✅ PRACTICE MCQs</span>
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 14px', fontSize: '20px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
          {subject.title} ({subject.code}) — MCQ Practice Set
        </h2>

        {/* Share buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>Share:</span>
          <a href={`https://wa.me/?text=${shareTitle}%20${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#25D366', color: '#fff', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#E1306C', color: '#fff', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Instagram</a>
          <a href={`fb-messenger://share/?link=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#00B2FF', color: '#fff', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Messenger</a>
          <button onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard.writeText(pageUrl) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Copy Link</button>
        </div>
      </div>

      {/* Filters + white paper card */}
      <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* Filter Bar */}
        {(years.length > 0 || categories.length > 0) && (
          <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Filter:</span>
            {years.length > 1 && (
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ fontSize: '13px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            )}
            {categories.length > 1 && (
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ fontSize: '13px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c as string}>{formatExamType(c as string)}</option>)}
              </select>
            )}
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>{filtered.length} question{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Questions */}
        <div style={{ padding: '20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>No MCQs match the selected filters.</p>
          ) : (
            filtered.map((m, i) => <McqItem key={m.id} mcq={m} index={i} />)
          )}
        </div>
      </div>
    </div>
  )
}

function McqItem({ mcq, index }: { mcq: MCQ, index: number }) {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '18px 20px',
      marginBottom: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      {/* Meta Badges */}
      {(mcq.year || mcq.examCategory) && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {mcq.year && (
            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>📅 {mcq.year}</span>
          )}
          {mcq.examCategory && (
            <span style={{ fontSize: '11px', background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{formatExamType(mcq.examCategory)}</span>
          )}
        </div>
      )}

      <p style={{ fontWeight: 600, marginBottom: '14px', color: '#1f2937', fontSize: '15px', lineHeight: 1.5 }}>
        {index + 1}. {mcq.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mcq.options.map((opt, idx) => {
          const isSelected = selectedOpt === idx
          const isCorrect = mcq.correctOption === idx
          const showResult = selectedOpt !== null

          let bg = '#f9fafb'
          let border = '1px solid #e5e7eb'
          let color = '#333333'
          let fontWeight = 'normal'

          if (showResult) {
            if (isCorrect) { bg = '#fff3cd'; border = '1px solid #ffc107'; color = '#856404'; fontWeight = 'bold' }
            else if (isSelected) { bg = '#f8d7da'; border = '1px solid #f5c6cb'; color = '#721c24' }
          }

          return (
            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '6px', fontSize: '14px', cursor: selectedOpt === null ? 'pointer' : 'default', background: bg, border, color, fontWeight: fontWeight as any, transition: 'all 0.2s ease', margin: 0 }}
              onMouseEnter={e => { if (selectedOpt === null) { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6' } }}
              onMouseLeave={e => { if (selectedOpt === null) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb' } }}
            >
              <input type="radio" name={`mcq-${mcq.id}`} value={idx} checked={isSelected || (showResult && isCorrect)} onChange={() => { if (selectedOpt === null) setSelectedOpt(idx) }} disabled={showResult && !isSelected && !isCorrect} style={{ margin: 0, accentColor: showResult && isCorrect ? '#856404' : '#0b3c5d', cursor: selectedOpt === null ? 'pointer' : 'default' }} />
              <span>{String.fromCharCode(97 + idx)}) {opt}</span>
            </label>
          )
        })}
      </div>

      {selectedOpt !== null && mcq.explanation && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '14px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#0c4a6e', border: '1px solid #bae6fd' }}>
          <strong>💡 Explanation:</strong> {mcq.explanation}
        </motion.div>
      )}
    </div>
  )
}
