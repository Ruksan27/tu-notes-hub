'use client'
// src/components/FacultiesList.tsx
import { useState } from 'react'
import Link from 'next/link'

interface Faculty {
  id: string
  name: string
  slug: string
  icon: string | null
  systemType: 'SEMESTER' | 'YEARLY'
  _count: {
    semesters: number
  }
}

const FACULTY_COLORS: Record<string, string> = {
  bca:   'linear-gradient(135deg, #6366f1, #8b5cf6)',
  csit:  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  bit:   'linear-gradient(135deg, #10b981, #06b6d4)',
  bscit: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
  bim:   'linear-gradient(135deg, #a78bfa, #6366f1)',
  be:    'linear-gradient(135deg, #8b5cf6, #6366f1)',
  bbs:   'linear-gradient(135deg, #f59e0b, #f97316)',
  bba:   'linear-gradient(135deg, #ec4899, #f43f5e)',
  bba_bi:'linear-gradient(135deg, #f97316, #ec4899)',
  mba:   'linear-gradient(135deg, #f43f5e, #ec4899)',
  bsc:   'linear-gradient(135deg, #14b8a6, #10b981)',
  ba:    'linear-gradient(135deg, #f97316, #ef4444)',
  bed:   'linear-gradient(135deg, #22d3ee, #0ea5e9)',
  llb:   'linear-gradient(135deg, #6366f1, #ec4899)',
  mbbs:  'linear-gradient(135deg, #ef4444, #f97316)',
  bsag:  'linear-gradient(135deg, #84cc16, #16a34a)',
  bsc_ag:'linear-gradient(135deg, #22c55e, #84cc16)',
}

// Priority group ordering: 0=IT (first), 1=Management, 2=Science, 3=Education/Arts, 99=rest
const PRIORITY_GROUPS: Record<string, number> = {
  csit: 0, bca: 0, bit: 0, bscit: 0, bim: 0, be: 0,
  bbs: 1, bba: 1, mba: 1,
  bsc: 2, bsag: 2,
  bed: 3, ba: 3,
  llb: 4, mbbs: 4,
}

function getPriority(id: string): number {
  const lower = id.toLowerCase()
  return PRIORITY_GROUPS[lower] ?? 99
}

export default function FacultiesList({ initialFaculties }: { initialFaculties: Faculty[] }) {
  const [search, setSearch] = useState('')

  const filtered = initialFaculties
    .filter(
      (f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const pa = getPriority(a.id)
      const pb = getPriority(b.id)
      if (pa !== pb) return pa - pb
      return a.id.localeCompare(b.id) // alpha within group
    })

  return (
    <div>
      {/* Search Input */}
      <div style={{ maxWidth: '480px', margin: '0 auto 40px', position: 'relative' }}>
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search faculties (e.g. BCA, CSIT, BBS...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '14px 20px',
            fontSize: '15px',
            borderRadius: '12px',
            border: '1px solid var(--clr-border)',
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'var(--shadow-glow)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--clr-text-3)',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Section label: IT Subjects First */}
      {!search && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            💻 IT &amp; Technology
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.2)' }} />
        </div>
      )}

      {/* Faculty Cards — 4-column grid */}
      <div
        className="faculties-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}
      >
        {filtered.length > 0 ? (
          filtered.map((f, idx) => {
            const prevGroup = idx > 0 ? getPriority(filtered[idx - 1].id) : -1
            const currGroup = getPriority(f.id)
            const isNewGroup = !search && idx > 0 && currGroup !== prevGroup

            const GROUP_LABELS: Record<number, string> = {
              0: '💻 IT & Technology',
              1: '📊 Management',
              2: '🔬 Science',
              3: '🎓 Education & Arts',
              4: '⚖️ Law & Medicine',
              99: '📚 Other Programs',
            }

            return (
              <div key={f.id} style={{ display: 'contents' }}>
                {isNewGroup && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      margin: '12px 0 4px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      {GROUP_LABELS[currGroup] ?? '📚 Other Programs'}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.2)' }} />
                  </div>
                )}

                <Link
                  key={f.id}
                  href={`/faculty/${f.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass-card hover-lift"
                    style={{
                      padding: '22px 20px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Colour accent top bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '3px',
                        background: FACULTY_COLORS[f.id.toLowerCase()] || 'var(--grad-brand)',
                      }}
                    />

                    {/* Icon */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: FACULTY_COLORS[f.id.toLowerCase()] || 'var(--grad-brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        marginBottom: '14px',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {f.icon || '📖'}
                    </div>

                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>
                      {f.id.toUpperCase()}
                    </h2>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '12px', marginBottom: '14px', lineHeight: 1.5, flex: 1 }}>
                      {f.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        {f._count.semesters} {f.systemType === 'YEARLY' ? 'Years' : 'Semesters'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--clr-primary-h)', fontWeight: 600 }}>
                        Browse →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 24px',
              color: 'var(--clr-text-3)',
            }}
          >
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🔍</span>
            <p style={{ color: 'var(--clr-text-2)', fontWeight: 600, fontSize: '16px' }}>No faculties match &quot;{search}&quot;</p>
            <p style={{ fontSize: '13px' }}>Try searching with a different term.</p>
          </div>
        )}
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 1100px) {
          .faculties-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 760px) {
          .faculties-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .faculties-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
