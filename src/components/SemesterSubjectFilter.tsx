// src/components/SemesterSubjectFilter.tsx
'use client'

import { useState, useMemo } from 'react'
import SubjectRow from '@/components/SubjectRow'

interface Props {
  subjects: any[]
  facultyId: string
  semesterOrder: number
  systemType: 'SEMESTER' | 'YEARLY'
  initialSyllabus?: string
}

export default function SemesterSubjectFilter({
  subjects,
  facultyId,
  semesterOrder,
  systemType,
  initialSyllabus = 'new',
}: Props) {
  // Automatically detect if there are both new and old syllabus subjects in this semester
  const hasNewAndOld = useMemo(() => {
    let hasNew = false
    let hasOld = false
    for (const sub of subjects) {
      if (sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ')) hasNew = true
      if (
        sub.title.includes('Old Syllabus') ||
        sub.code.startsWith('CACS') ||
        sub.code.startsWith('CAMT') ||
        sub.code.startsWith('CASO') ||
        sub.code.startsWith('CAEN') ||
        sub.code.startsWith('CAAC') ||
        sub.code.startsWith('CAST')
      ) hasOld = true
    }
    return hasNew && hasOld
  }, [subjects])

  const [activeTab, setActiveTab] = useState<'new' | 'old'>(
    initialSyllabus === 'old' ? 'old' : 'new'
  )

  const filteredSubjects = useMemo(() => {
    if (!hasNewAndOld) return subjects

    return subjects.filter((sub) => {
      const isNew = sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ')
      const isOld =
        sub.title.includes('Old Syllabus') ||
        sub.code.startsWith('CACS') ||
        sub.code.startsWith('CAMT') ||
        sub.code.startsWith('CASO') ||
        sub.code.startsWith('CAEN') ||
        sub.code.startsWith('CAAC') ||
        sub.code.startsWith('CAST') ||
        sub.code.startsWith('CAPJ') ||
        sub.code.startsWith('CAEC') ||
        sub.code.startsWith('CAMG') ||
        sub.code.startsWith('CAIN') ||
        sub.code.startsWith('CAOR')

      if (activeTab === 'new') return isNew
      if (activeTab === 'old') return isOld
      return true
    })
  }, [subjects, activeTab, hasNewAndOld])

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Syllabus Filter Selector if faculty has both */}
      {hasNewAndOld && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '14px 20px',
          borderRadius: '14px',
          background: 'rgba(18, 21, 38, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎓</span>
            <span>Filter Curriculum:</span>
          </div>

          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: activeTab === 'new' ? 'var(--grad-brand)' : 'transparent',
                color: activeTab === 'new' ? '#ffffff' : 'var(--clr-text-2)',
              }}
            >
              ✨ New Syllabus
            </button>
            <button
              onClick={() => setActiveTab('old')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: activeTab === 'old' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                color: activeTab === 'old' ? '#ffffff' : 'var(--clr-text-2)',
              }}
            >
              📜 Old Syllabus
            </button>
          </div>
        </div>
      )}

      {/* Subjects List */}
      {filteredSubjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>No Subjects Found</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            No subjects matching the selected curriculum version for this semester.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSubjects.map((subject) => (
            <SubjectRow
              key={subject.id}
              subject={subject}
              facultyId={facultyId}
              semesterOrder={semesterOrder}
              systemType={systemType}
            />
          ))}
        </div>
      )}
    </div>
  )
}
