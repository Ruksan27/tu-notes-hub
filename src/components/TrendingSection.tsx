'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TrendingData {
  popularFaculties: { id: string; name: string; slug: string; icon: string; badge: string; downloads: number }[]
  trendingSubjects: { id: string; title: string; code: string; notesCount: number; pastPapersCount: number; totalDownloads: number }[]
  mostViewedNotes: { id: string; title: string; downloadCount: number; isPremium: boolean; subject?: { title: string; code: string } }[]
}

export function TrendingSection() {
  const [data, setData] = useState<TrendingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(d => {
        if (d.popularFaculties) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-text-3)' }}>
        <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
        Loading Trending Analytics...
      </div>
    )
  }

  if (!data) return null

  const { popularFaculties, trendingSubjects, mostViewedNotes } = data

  return (
    <section className="section" style={{ padding: '60px 0', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <div className="badge badge-strong" style={{ marginBottom: '12px', display: 'inline-flex', fontSize: '11px' }}>
            📊 REAL USER ANALYTICS
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
            🔥 Trending <span className="text-gradient">Content</span>
          </h2>
          <p style={{ color: 'var(--clr-text-2)', maxWidth: '600px', margin: '0 auto' }}>
            Calculated live from student views, paper downloads, and active user requests.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {/* Card 1: Popular Faculties */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '16px', borderTop: '3px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>🎓</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Popular Faculties</h3>
                <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Top Faculties ranked by student activity</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {popularFaculties.map((fac, idx) => (
                <Link
                  key={fac.id}
                  href={`/faculty/${fac.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--clr-text-1)' }}>
                        {fac.id.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>{fac.name}</div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '12px',
                    background: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : idx === 1 ? 'rgba(148, 163, 184, 0.15)' : idx === 2 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f59e0b' : '#a5b4fc',
                  }}>
                    {fac.badge}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Card 2: Trending Subjects */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '16px', borderTop: '3px solid #06b6d4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>📘</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Trending Subjects</h3>
                <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Most searched subjects this week</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingSubjects.map((sub, idx) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#06b6d4', width: '20px' }}>
                      {idx + 1}.
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--clr-text-1)' }}>
                        {sub.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>Code: {sub.code} • {sub.notesCount} Notes</div>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clr-text-2)' }}>
                    🔥 {sub.totalDownloads} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Most Viewed Notes */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '16px', borderTop: '3px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>📄</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Most Viewed Notes</h3>
                <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Top downloaded study materials</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mostViewedNotes.map((note, idx) => (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', width: '20px', flexShrink: 0 }}>
                      {idx + 1}.
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {note.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>{note.subject?.title || 'General Note'}</div>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', flexShrink: 0, marginLeft: '8px' }}>
                    📥 {note.downloadCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
