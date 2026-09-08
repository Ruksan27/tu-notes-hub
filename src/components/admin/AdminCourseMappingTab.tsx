'use client'
// src/components/admin/AdminCourseMappingTab.tsx
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'

interface Faculty {
  id: string
  name: string
  icon: string
  systemType: 'SEMESTER' | 'YEARLY'
}

interface Semester {
  id: string
  name: string
  order: number
}

interface SubjectCounts {
  notes: number
  pastPapers: number
  mcqs: number
  solutionBooks: number
}

interface SubjectItem {
  id: string
  title: string
  code: string
  semesterId: string
  linkedSubjectId?: string | null
  linkedSubject?: {
    id: string
    title: string
    code: string
    semester?: { name: string; order: number }
    _count?: SubjectCounts
  } | null
  linkIncludeNotes?: boolean
  linkIncludePastPapers?: boolean
  linkIncludeMCQs?: boolean
  linkIncludeBooks?: boolean
  semester?: {
    id: string
    name: string
    order: number
    facultyId: string
    faculty?: Faculty
  }
  _count?: SubjectCounts
}

export default function AdminCourseMappingTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string>('bca')
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [sourceSemOrder, setSourceSemOrder] = useState<number>(3)
  const [targetSemOrder, setTargetSemOrder] = useState<number>(2)

  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Modal State
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false)
  const [selectedSource, setSelectedSource] = useState<SubjectItem | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<SubjectItem | null>(null)
  const [linkIncludeNotes, setLinkIncludeNotes] = useState<boolean>(true)
  const [linkIncludePastPapers, setLinkIncludePastPapers] = useState<boolean>(false)
  const [linkIncludeMCQs, setLinkIncludeMCQs] = useState<boolean>(true)
  const [linkIncludeBooks, setLinkIncludeBooks] = useState<boolean>(true)
  const [savingLink, setSavingLink] = useState<boolean>(false)

  // Drag & Drop State
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null)

  // Fetch Faculties
  useEffect(() => {
    fetch('/api/admin/faculties')
      .then((r) => r.json())
      .then((d) => {
        const list = d.faculties || []
        setFaculties(list)
        if (list.length > 0 && !list.find((f: any) => f.id === 'bca')) {
          setSelectedFaculty(list[0].id)
        }
      })
      .catch(() => toast.error('Failed to load faculties'))
  }, [])

  // Fetch Semesters for selected faculty
  useEffect(() => {
    if (!selectedFaculty) return
    fetch(`/api/admin/semesters?facultyId=${selectedFaculty}`)
      .then((r) => r.json())
      .then((d) => setSemesters(d.semesters || []))
      .catch(() => setSemesters([]))
  }, [selectedFaculty])

  // Fetch Subject Mappings
  const loadMappings = useCallback(async () => {
    if (!selectedFaculty) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subject-mapping?facultyId=${selectedFaculty}`)
      if (res.ok) {
        const data = await res.json()
        setSubjects(data.subjects || [])
      }
    } catch {
      toast.error('Failed to load subject mappings')
    } finally {
      setLoading(false)
    }
  }, [selectedFaculty])

  useEffect(() => {
    loadMappings()
  }, [loadMappings])

  // Filter subjects for Source Column (Old Syllabus)
  const sourceSubjects = subjects.filter((s) => {
    const isOld =
      s.title.includes('Old Syllabus') ||
      s.code.startsWith('CACS') ||
      s.code.startsWith('CAMT') ||
      s.code.startsWith('CASO') ||
      s.code.startsWith('CAEN') ||
      s.code.startsWith('CAAC') ||
      s.code.startsWith('CAST') ||
      s.code.startsWith('CAPJ') ||
      s.code.startsWith('CAEC') ||
      s.code.startsWith('CAMG') ||
      s.code.startsWith('CAIN') ||
      s.code.startsWith('CAOR')

    const matchSem = s.semester?.order === sourceSemOrder
    const matchSearch =
      !searchTerm ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())

    return isOld && matchSem && matchSearch
  })

  // Filter subjects for Target Column (New Syllabus)
  const targetSubjects = subjects.filter((s) => {
    const isNew =
      s.title.includes('New Syllabus') ||
      s.code.startsWith('BCA ') ||
      (!s.title.includes('Old Syllabus') && !s.code.startsWith('CACS'))

    const matchSem = s.semester?.order === targetSemOrder
    const matchSearch =
      !searchTerm ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())

    return isNew && matchSem && matchSearch
  })

  // Open Link Modal
  function openLinkModal(source: SubjectItem, target?: SubjectItem) {
    setSelectedSource(source)
    setSelectedTarget(target || null)

    if (target && target.linkedSubjectId === source.id) {
      setLinkIncludeNotes(target.linkIncludeNotes ?? true)
      setLinkIncludePastPapers(target.linkIncludePastPapers ?? false)
      setLinkIncludeMCQs(target.linkIncludeMCQs ?? true)
      setLinkIncludeBooks(target.linkIncludeBooks ?? true)
    } else {
      setLinkIncludeNotes(true)
      setLinkIncludePastPapers(false)
      setLinkIncludeMCQs(true)
      setLinkIncludeBooks(true)
    }

    setLinkModalOpen(true)
  }

  // Handle Save Link
  async function handleSaveLink() {
    if (!selectedSource || !selectedTarget) {
      toast.error('Please select both a source and a target subject')
      return
    }

    setSavingLink(true)
    try {
      const res = await fetch('/api/admin/subject-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSubjectId: selectedTarget.id,
          sourceSubjectId: selectedSource.id,
          linkIncludeNotes,
          linkIncludePastPapers,
          linkIncludeMCQs,
          linkIncludeBooks,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Linked ${selectedSource.code} to ${selectedTarget.code} successfully! 🎉`)
        setLinkModalOpen(false)
        loadMappings()
      } else {
        toast.error(data.error || 'Failed to link subjects')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingLink(false)
    }
  }

  // Handle Unlink
  async function handleUnlink(targetSubjectId: string) {
    if (!confirm('Unlink this subject? Shared notes & materials will no longer show under the new subject.')) return
    try {
      const res = await fetch(`/api/admin/subject-mapping?targetSubjectId=${targetSubjectId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Subject unlinked successfully!')
        loadMappings()
      } else {
        toast.error('Failed to unlink subject')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, sourceId: string) => {
    e.dataTransfer.setData('text/plain', sourceId)
    setDraggedSubjectId(sourceId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, target: SubjectItem) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain') || draggedSubjectId
    setDraggedSubjectId(null)

    if (!sourceId) return
    const source = subjects.find((s) => s.id === sourceId)
    if (source) {
      openLinkModal(source, target)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Filters */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--clr-text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔗</span> Course & Syllabus Mapping Tool
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
              Map Old Syllabus subjects to New Syllabus semesters. Share Notes, MCQs, and Solution Books instantly without re-uploading PDFs!
            </p>
          </div>

          <button onClick={loadMappings} className="btn btn-sm btn-outline" style={{ fontSize: '12px' }}>
            🔄 Refresh List
          </button>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          {/* Faculty Filter */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '6px' }}>
              Faculty / Program:
            </label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="admin-search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon} {f.name} ({f.id.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '6px' }}>
              Search Subject Title / Code:
            </label>
            <input
              type="text"
              placeholder="e.g. Microprocessor or CACS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Mapping Workbench */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* ── Left Column: Source (Old Syllabus) ── */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            background: 'rgba(245, 158, 11, 0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '10px', padding: '3px 8px', fontWeight: 700 }}>
                SOURCE
              </span>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--clr-text-1)', marginTop: '4px' }}>
                📜 Old Syllabus Subjects
              </h4>
            </div>

            {/* Semester Select */}
            <select
              value={sourceSemOrder}
              onChange={(e) => setSourceSemOrder(parseInt(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(9, 11, 22, 0.8)', color: '#fbbf24', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ord) => (
                <option key={ord} value={ord}>
                  Old Semester {ord}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '16px' }}>
            💡 Drag a card or click &quot;Link ➜&quot; to connect notes/materials to a target semester.
          </p>

          {/* Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading subjects...</p>
            ) : sourceSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--clr-text-3)' }}>
                <p style={{ fontSize: '24px' }}>📂</p>
                <p style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>No Old Syllabus subjects found for Semester {sourceSemOrder}.</p>
              </div>
            ) : (
              sourceSubjects.map((sub) => (
                <motion.div
                  key={sub.id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, sub.id)}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card"
                  style={{
                    padding: '14px 16px',
                    margin: 0,
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'grab',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', fontSize: '10px', fontWeight: 700 }}>
                        {sub.code}
                      </span>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginTop: '4px' }}>
                        {sub.title}
                      </h5>
                    </div>

                    <button
                      onClick={() => openLinkModal(sub)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: '6px' }}
                    >
                      Link ➜
                    </button>
                  </div>

                  {/* Materials Count */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    <span>📄 {sub._count?.notes || 0} Notes</span>
                    <span>📝 {sub._count?.pastPapers || 0} Papers</span>
                    <span>✅ {sub._count?.mcqs || 0} MCQs</span>
                    <span>📘 {sub._count?.solutionBooks || 0} Books</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Column: Destination (New Syllabus) ── */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            background: 'rgba(16, 185, 129, 0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', fontSize: '10px', padding: '3px 8px', fontWeight: 700 }}>
                DESTINATION
              </span>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--clr-text-1)', marginTop: '4px' }}>
                ✨ New Syllabus Subjects
              </h4>
            </div>

            {/* Semester Select */}
            <select
              value={targetSemOrder}
              onChange={(e) => setTargetSemOrder(parseInt(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(9, 11, 22, 0.8)', color: '#6ee7b7', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ord) => (
                <option key={ord} value={ord}>
                  New Semester {ord}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '16px' }}>
            🎯 Target semester slots. Drop an Old Syllabus card here to map materials!
          </p>

          {/* Target Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading subjects...</p>
            ) : targetSubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--clr-text-3)' }}>
                <p style={{ fontSize: '24px' }}>🎯</p>
                <p style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>No New Syllabus subjects found for Semester {targetSemOrder}.</p>
              </div>
            ) : (
              targetSubjects.map((targetSub) => {
                const linked = targetSub.linkedSubject
                return (
                  <div
                    key={targetSub.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, targetSub)}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      margin: 0,
                      borderRadius: '12px',
                      background: linked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: linked ? '1px solid rgba(16, 185, 129, 0.3)' : '2px dashed rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '10px', fontWeight: 700 }}>
                          {targetSub.code}
                        </span>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginTop: '4px' }}>
                          {targetSub.title}
                        </h5>
                      </div>

                      {linked && (
                        <button
                          onClick={() => handleUnlink(targetSub.id)}
                          className="btn btn-sm"
                          style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}
                        >
                          Unlink ❌
                        </button>
                      )}
                    </div>

                    {/* Mapping Info Slot */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {linked ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6ee7b7', fontWeight: 600 }}>
                            <span>🔗 Linked with:</span>
                            <span style={{ color: '#fff' }}>
                              {linked.code} ({linked.title})
                            </span>
                          </div>

                          {/* Flags Badges */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {targetSub.linkIncludeNotes && <span className="badge" style={{ fontSize: '9.5px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>✓ Notes</span>}
                            {targetSub.linkIncludeMCQs && <span className="badge" style={{ fontSize: '9.5px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>✓ MCQs</span>}
                            {targetSub.linkIncludeBooks && <span className="badge" style={{ fontSize: '9.5px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>✓ Books</span>}
                            {targetSub.linkIncludePastPapers && <span className="badge" style={{ fontSize: '9.5px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>✓ Papers</span>}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--clr-text-3)', fontStyle: 'italic' }}>
                          ➕ Drop an Old Syllabus Subject card here to map
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Link Configuration Modal ── */}
      <AnimatePresence>
        {linkModalOpen && selectedSource && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '28px',
                borderRadius: '16px',
                background: 'var(--clr-bg-surface, #0f172a)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)', marginBottom: '8px' }}>
                🔗 Map Subject & Material Sharing Options
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '20px' }}>
                Connect Old Syllabus content to the target New Syllabus subject.
              </p>

              {/* Source Details */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>Source (Old Subject):</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {selectedSource.code} — {selectedSource.title}
                </div>
              </div>

              {/* Target Dropdown Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '6px' }}>
                  Target (New Subject):
                </label>
                <select
                  value={selectedTarget?.id || ''}
                  onChange={(e) => {
                    const found = subjects.find((s) => s.id === e.target.value)
                    setSelectedTarget(found || null)
                  }}
                  className="admin-search-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="">-- Select Target New Subject --</option>
                  {subjects
                    .filter((s) => s.id !== selectedSource.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        Sem {s.semester?.order} • {s.code} ({s.title})
                      </option>
                    ))}
                </select>
              </div>

              {/* Material Sharing Checkboxes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '10px' }}>
                  Select Materials to Share:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-text-1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={linkIncludeNotes}
                      onChange={(e) => setLinkIncludeNotes(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    📄 Share Notes
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-text-1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={linkIncludeMCQs}
                      onChange={(e) => setLinkIncludeMCQs(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    ✅ Share MCQs
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-text-1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={linkIncludeBooks}
                      onChange={(e) => setLinkIncludeBooks(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    📘 Share Solution Books
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-text-1)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={linkIncludePastPapers}
                      onChange={(e) => setLinkIncludePastPapers(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    📝 Share Past Papers
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setLinkModalOpen(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button
                  onClick={handleSaveLink}
                  disabled={savingLink || !selectedTarget}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {savingLink ? 'Saving...' : 'Confirm Mapping 🔗'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
