'use client'
// src/components/SubjectRow.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { getNoteSlug, getPaperSlug, getSemesterPath, slugify } from '@/lib/slugs'

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

interface Cheatsheet {
  id: string
  title: string
  content: string
}

interface Subject {
  id: string
  title: string
  code: string
  notes: Note[]
  pastPapers: PastPaper[]
  cheatsheets: Cheatsheet[]
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
  const [activeTab, setActiveTab] = useState<'notes' | 'labWork' | 'projectWork' | 'project' | 'pastPapers' | 'guide' | 'cheatsheets' | null>(null)

  const semPath = getSemesterPath(facultyId, semesterOrder, systemType)

  const getResourceLink = (itemTitle: string, category: string, fallbackSlug: string) => {
    if (semPath) {
      const subSlug = slugify(subject.title)
      const itemSlug = slugify(itemTitle) || 'resource'
      
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
  const notes = subject.notes.filter(n => !['PROJECT_WORK', 'PROJECT', 'GUIDE', 'LAB_WORK'].includes(n.noteType))
  const labWorks = subject.notes.filter(n => n.noteType === 'LAB_WORK')
  const projectWorks = subject.notes.filter(n => n.noteType === 'PROJECT_WORK')
  const projects = subject.notes.filter(n => n.noteType === 'PROJECT')
  const guides = subject.notes.filter(n => n.noteType === 'GUIDE')
  const pastPapers = subject.pastPapers
  const cheatsheets = subject.cheatsheets

  const toggleTab = (tabName: 'notes' | 'labWork' | 'projectWork' | 'project' | 'pastPapers' | 'guide' | 'cheatsheets') => {
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
    else if (cheatsheets.length > 0) setActiveTab('cheatsheets')
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
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--clr-text-1)' }}>{subject.title}</h3>
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

            {cheatsheets.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleTab('cheatsheets') }}
                style={getPillStyle('cheatsheets', cheatsheets.length)}
              >
                📋 Cheatsheet ({cheatsheets.length})
              </button>
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

              {/* Cheatsheets List */}
              {activeTab === 'cheatsheets' && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>📋 Syllabus & Cheatsheets</h4>
                  <motion.div variants={listContainerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {cheatsheets.map(cs => (
                      <motion.div key={cs.id} variants={cardItemVariants} className="glass-card" style={{ padding: '16px', margin: 0, borderRadius: '12px', background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{cs.title}</p>
                        <span className="badge badge-elite" style={{ fontSize: '9px' }}>ELITE AI ONLY</span>
                      </motion.div>
                    ))}
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
