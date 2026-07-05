'use client'
// src/components/SubjectRow.tsx
import { useState } from 'react'
import Link from 'next/link'

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

export default function SubjectRow({ subject }: { subject: Subject }) {
  const [activeTab, setActiveTab] = useState<'notes' | 'labWork' | 'projectWork' | 'project' | 'pastPapers' | 'guide' | 'cheatsheets' | null>(null)

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
      transition: 'all 0.2s ease',
    }
  }

  return (
    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
      {/* Row Header */}
      <div
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.01)',
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
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{subject.title}</h3>
        </div>

        {/* Action Toggles */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {notes.length > 0 && (
            <button
              onClick={() => toggleTab('notes')}
              style={getPillStyle('notes', notes.length)}
            >
              📄 Notes ({notes.length})
            </button>
          )}
          
          {labWorks.length > 0 && (
            <button
              onClick={() => toggleTab('labWork')}
              style={getPillStyle('labWork', labWorks.length)}
            >
              🧪 Lab Work ({labWorks.length})
            </button>
          )}

          {projectWorks.length > 0 && (
            <button
              onClick={() => toggleTab('projectWork')}
              style={getPillStyle('projectWork', projectWorks.length)}
            >
              📁 Project Work ({projectWorks.length})
            </button>
          )}

          {projects.length > 0 && (
            <button
              onClick={() => toggleTab('project')}
              style={getPillStyle('project', projects.length)}
            >
              💻 Project ({projects.length})
            </button>
          )}

          {pastPapers.length > 0 && (
            <button
              onClick={() => toggleTab('pastPapers')}
              style={getPillStyle('pastPapers', pastPapers.length)}
            >
              📝 Past Papers ({pastPapers.length})
            </button>
          )}

          {guides.length > 0 && (
            <button
              onClick={() => toggleTab('guide')}
              style={getPillStyle('guide', guides.length)}
            >
              📘 Guide ({guides.length})
            </button>
          )}

          {cheatsheets.length > 0 && (
            <button
              onClick={() => toggleTab('cheatsheets')}
              style={getPillStyle('cheatsheets', cheatsheets.length)}
            >
              📋 Cheatsheet ({cheatsheets.length})
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Accordion Panel */}
      {activeTab && (
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--clr-border)',
            background: 'rgba(255, 255, 255, 0.015)',
          }}
        >
          {/* Notes List */}
          {activeTab === 'notes' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>📄 Study Notes</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {notes.map(note => (
                  <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{note.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span>{note.noteType.replace('_', ' ')} ({note.fileSize || 'N/A'})</span>
                        {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Lab Work List */}
          {activeTab === 'labWork' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>🧪 Lab Works & Reports</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {labWorks.map(note => (
                  <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{note.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span>{note.fileSize || 'N/A'}</span>
                        {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Project Works List */}
          {activeTab === 'projectWork' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>📁 Project Works</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {projectWorks.map(note => (
                  <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{note.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span>{note.fileSize || 'N/A'}</span>
                        {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects List */}
          {activeTab === 'project' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>💻 Projects</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {projects.map(note => (
                  <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{note.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span>{note.fileSize || 'N/A'}</span>
                        {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Papers List */}
          {activeTab === 'pastPapers' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>📝 Question Papers</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {pastPapers.map(pp => (
                  <Link key={pp.id} href={`/download/${pp.id}?type=paper`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer', background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.15)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{pp.year} {pp.examType.replace('_', ' ')}</p>
                      <span style={{ fontSize: '11px', color: 'var(--clr-accent)', fontWeight: 600 }}>Download / View Paper →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Guides List */}
          {activeTab === 'guide' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>📘 Exam Guides</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {guides.map(note => (
                  <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px', margin: 0, cursor: 'pointer' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{note.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span>{note.fileSize || 'N/A'}</span>
                        {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cheatsheets List */}
          {activeTab === 'cheatsheets' && (
            <div>
              <h4 style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '12px', textTransform: 'uppercase' }}>📋 Syllabus & Cheatsheets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {cheatsheets.map(cs => (
                  <div key={cs.id} className="glass-card" style={{ padding: '14px', margin: 0, background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.15)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px' }}>{cs.title}</p>
                    <span className="badge badge-elite" style={{ fontSize: '9px' }}>ELITE AI ONLY</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
