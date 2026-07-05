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
  bca: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  csit: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  bit: 'linear-gradient(135deg, #10b981, #06b6d4)',
  bbs: 'linear-gradient(135deg, #f59e0b, #f97316)',
  bba: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  be: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  bsc: 'linear-gradient(135deg, #14b8a6, #10b981)',
  ba: 'linear-gradient(135deg, #f97316, #ef4444)',
  llb: 'linear-gradient(135deg, #6366f1, #ec4899)',
  mbbs: 'linear-gradient(135deg, #ef4444, #f97316)',
}

export default function FacultiesList({ initialFaculties }: { initialFaculties: Faculty[] }) {
  const [search, setSearch] = useState('')

  const filtered = initialFaculties.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Faculty Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        {filtered.length > 0 ? (
          filtered.map((f) => (
            <Link key={f.id} href={`/faculty/${f.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="glass-card"
                style={{
                  padding: '28px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Glow accent top-left */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: FACULTY_COLORS[f.id] || 'var(--grad-brand)',
                  }}
                />

                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: FACULTY_COLORS[f.id] || 'var(--grad-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {f.icon || '📖'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{f.id.toUpperCase()}</h2>
                </div>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
                  {f.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyComposite: 'space-between', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                    {f._count.semesters} {f.systemType === 'YEARLY' ? 'Years' : 'Semesters'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--clr-primary-h)', fontWeight: 600 }}>
                    Browse Notes →
                  </span>
                </div>
              </div>
            </Link>
          ))
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
            <p className="font-semibold text-lg" style={{ color: 'var(--clr-text-2)' }}>No faculties match &quot;{search}&quot;</p>
            <p style={{ fontSize: '13px' }}>Try searching with a different term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
