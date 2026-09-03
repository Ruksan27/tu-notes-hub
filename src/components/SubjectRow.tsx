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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const u = JSON.parse(stored)
        setIsEliteAI(u?.packageType === 'ELITE_AI')
      }
    } catch {}
  }, [])

  const semPath = getSemesterPath(facultyId, semesterOrder, systemType)

  const getResourceLink = (itemTitle: string, category: string, fallbackSlug: string) => {
    if (semPath) {
      // Use clean subject title for SEO — "computer-graphics-and-animation" ranks better than "cacs305"
      // slugify() already strips "(Old Syllabus)" / "(New Syllabus)" suffixes
      const subSlug = slugify(subject.title) || slugify(subject.code)
      const rawItemSlug = slugify(itemTitle) || 'resource'
      // Truncate item slug to keep URL clean (max 50 chars for item part)
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
    else if (mcqs.length > 0) setActiveTab('mcqs')
  }

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className="glass-card"
      style={{
        padding: '0',
        overflow: 'hidden',
        marginBottom: '16px',
        borderLeft: activeTab ? '4px solid var(--clr-primary-h)' : '4px solid transparent',
        borderColor: activeTab ? 'rgba(99,102,241,0.35)' : 'var(--clr-border)',
        boxShadow: activeTab ? '0 8px 32px rgba(99, 102, 241, 0.12)' : 'var(--shadow-sm)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* Row Header */}
      <div
        onClick={handleRowClick}
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: activeTab ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.01)',
          cursor: 'pointer',
          transition: 'background 0.25s ease',
        }}
      >
        {/* Subject Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--clr-accent)',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'var(--font-display)',
            }}
          >
            {subject.code}
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--clr-text-1)' }}>
            {subject.title
              .replace(/\s*\(Old Syllabus\)/gi, '')
              .replace(/\s*\(New Syllabus\)/gi, '')
              .replace(/\s*\(Old\)/gi, '')
              .replace(/\s*\(New\)/gi, '')}
          </h3>
        </div>

        {/* Action Toggles & Expand Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {notes.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('notes') }}
                style={getPillStyle('notes', notes.length)}
              >
                📄 Notes ({notes.length})
              </button>
            )}
            
            {labWorks.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('labWork') }}
                style={getPillStyle('labWork', labWorks.length)}
              >
                🧪 Lab Work ({labWorks.length})
              </button>
            )}

            {projectWorks.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('projectWork') }}
                style={getPillStyle('projectWork', projectWorks.length)}
              >
                📁 Project Work ({projectWorks.length})
              </button>
            )}

            {projects.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('project') }}
                style={getPillStyle('project', projects.length)}
              >
                💻 Project ({projects.length})
              </button>
            )}

            {pastPapers.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('pastPapers') }}
                style={getPillStyle('pastPapers', pastPapers.length)}
              >
                📝 Question Papers ({pastPapers.length})
              </button>
            )}

            {guides.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('guide') }}
                style={getPillStyle('guide', guides.length)}
              >
                📘 Books & Guides ({guides.length})
              </button>
            )}

            {syllabusFiles.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('syllabus') }}
                style={{
                  ...getPillStyle('syllabus', syllabusFiles.length),
                  ...(activeTab === 'syllabus' ? {} : {
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                  }),
                }}
              >
                📋 Syllabus ({syllabusFiles.length})
              </button>
            )}

            {solutionBooks.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('solutionBooks') }}
                style={getPillStyle('solutionBooks', solutionBooks.length)}
              >
                📘 Solution Book ({solutionBooks.length})
              </button>
            )}

            {cheatsheets.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('cheatsheets') }}
                style={getPillStyle('cheatsheets', cheatsheets.length)}
              >
                📋 Cheatsheet ({cheatsheets.length})
              </button>
            )}

            {mcqs.length > 0 && (
              <Link
                href={`/mcq/${subject.id}`}
                onClick={e => e.stopPropagation()}
                style={{ textDecoration: 'none', pointerEvents: 'auto', zIndex: 10, position: 'relative' }}
              >
                <span style={{
                  ...getPillStyle('mcqs', mcqs.length),
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
                  ✅ MCQs
                </span>
              </Link>
            )}
          </div>

          <motion.span
            animate={{ rotate: activeTab ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{
              fontSize: '13px',
              color: activeTab ? 'var(--clr-accent-h)' : 'var(--clr-text-3)',
              display: 'inline-block',
            }}
          >
            ▼
          </motion.span>
        </div>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                            <span>{note.noteType.replace('_', ' ')} ({note.fileSize || 'N/A'})</span>
                            {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '2px 8px' }}>PREMIUM</span>}
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
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {pastPapers.map(pp => (
                      <Link key={pp.id} href={getResourceLink(`${pp.year} ${pp.examType.replace('_', ' ')}`, 'papers', getPaperSlug({ ...pp, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
                        <motion.div variants={cardItemVariants} whileHover={{ scale: 1.04, y: -3, boxShadow: '0 8px 24px rgba(6,182,212,0.2)' }} whileTap={{ scale: 0.98 }} className="glass-card" style={{ padding: '16px', margin: 0, cursor: 'pointer', borderRadius: '12px', background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.2)' }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{pp.year} {pp.examType.replace('_', ' ')}</p>
                          <span style={{ fontSize: '11px', color: 'var(--clr-accent-h)', fontWeight: 600 }}>Download / View Paper →</span>
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
                      <Link key={note.id} href={getResourceLink(note.title, 'notes', getNoteSlug({ ...note, subject: { title: subject.title, code: subject.code } }))} style={{ textDecoration: 'none' }}>
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

                  {/* Blurred preview cards always shown */}
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', filter: isEliteAI ? 'none' : 'blur(6px)', userSelect: isEliteAI ? 'auto' : 'none', pointerEvents: isEliteAI ? 'auto' : 'none' }}>
                    {cheatsheets.map(cs => (
                      <motion.div key={cs.id} variants={cardItemVariants} className="glass-card" style={{ padding: '16px', margin: 0, borderRadius: '12px', background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', margin: 0 }}>{cs.title}</p>
                          <span className="badge badge-elite" style={{ fontSize: '9px' }}>ELITE AI ONLY</span>
                        </div>
                        {cs.content && <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cs.content}</p>}
                        
                        {/* Attached Files List */}
                        {cs.files && Array.isArray(cs.files) && cs.files.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-primary-h)' }}>📎 Attached Files ({cs.files.length}):</span>
                            {cs.files.map((file: CheatsheetFile, fi: number) => {
                              const isImg = file.url?.match(/\.(jpg|jpeg|png|webp)/i) || file.type?.includes('image')
                              const isPdf = file.url?.endsWith('.pdf') || file.name?.endsWith('.pdf')
                              return (
                                <a
                                  key={fi}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: '12px', color: 'var(--clr-text-2)', textDecoration: 'none'
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {isImg ? '🖼️' : isPdf ? '📄' : '📝'} {file.name || `File ${fi + 1}`}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--clr-primary-h)', fontWeight: 600, shrink: 0 }}>View ↗</span>
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </motion.div>
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
                      background: 'rgba(9, 11, 22, 0.6)',
                      backdropFilter: 'blur(2px)',
                      borderRadius: '12px',
                    }}>
                      <div style={{ fontSize: '32px' }}>🔒</div>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Elite AI Plan Required</p>
                      <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', margin: 0, textAlign: 'center', maxWidth: '240px' }}>
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
                    <Link href={`/mcq/${subject.id}`} style={{ textDecoration: 'none' }}>
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
          <a href={`https://wa.me/?text=${shareTitle}%20${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#25D366', color: '#fff', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>🟢 WhatsApp</a>
          <a href={`viber://forward?text=${shareTitle}%20${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#7360F2', color: '#fff', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>🟣 Viber</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#1877F2', color: '#fff', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>🔵 Facebook</a>
          <button onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard.writeText(pageUrl) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🔗 Copy Link</button>
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
