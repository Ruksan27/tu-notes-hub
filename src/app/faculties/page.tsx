// src/app/faculties/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All TU Faculties — BCA, CSIT, BIT, BBS, BBA & More',
  description: 'Browse all Tribhuvan University faculties and access free study notes, past papers, and AI exam predictions.',
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

export default async function FacultiesPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { semesters: true } } },
  })

  return (
    <div className="container" style={{ padding: '60px 24px' }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '56px' }}>
        <div className="badge badge-elite" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          🏫 All Faculties
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', marginBottom: '16px' }}>
          Choose Your <span className="text-gradient">Faculty</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          Access free notes and past papers for all TU programs. Select your faculty to get started.
        </p>
      </div>

      {/* Faculty Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {faculties.length > 0 ? faculties.map((f) => (
          <Link key={f.id} href={`/faculty/${f.id}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="glass-card" style={{
              padding: '28px',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Glow accent top-left */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: FACULTY_COLORS[f.id] || 'var(--grad-brand)',
              }} />

              <div style={{
                width: '56px', height: '56px',
                borderRadius: 'var(--radius-md)',
                background: FACULTY_COLORS[f.id] || 'var(--grad-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
                marginBottom: '16px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              }}>
                {f.icon || '📖'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{f.id.toUpperCase()}</h2>
              </div>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
                {f.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                  {f._count.semesters} {f.systemType === 'YEARLY' ? 'Years' : 'Semesters'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--clr-primary-h)', fontWeight: 600 }}>
                  Browse Notes →
                </span>
              </div>
            </div>
          </Link>
        )) : (
          // Skeleton loaders
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '28px' }}>
              <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '12px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '90%' }} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
