'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import { getProjectSlug } from '@/lib/slugs'
import AdUnit from '@/components/ads/AdUnit'

type Project = {
  id: string
  title: string
  description: string
  technologies: string
  originalPrice: number
  discountPercentage: number
  thumbnailUrl: string | null
  features: string | null
  _count?: { orders: number }
}

const TECH_FILTERS = ['All', 'MERN', 'Django', 'WordPress', 'Next.js', 'React', 'Node.js', 'PHP', 'Python', 'Laravel', 'Flutter', 'MongoDB', 'PostgreSQL']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load projects')
        setLoading(false)
      })
  }, [])

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'All' || p.technologies.toLowerCase().includes(filter.toLowerCase())
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.technologies.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <main style={{ minHeight: '100vh', background: 'var(--clr-bg-900)', paddingBottom: '100px' }}>
      <style>{`
        /* ─── Projects Page Styles ─── */
        .proj-hero {
          background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.03) 60%, transparent 100%);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 60px 20px 40px;
          text-align: center;
        }
        @media (max-width: 640px) {
          .proj-hero { padding: 44px 16px 28px; }
        }

        .proj-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 480px;
          margin: 0 auto;
        }

        /* ─── Search bar + filter pills ─── */
        .proj-controls {
          max-width: 100%;
          padding: 20px 20px 0;
        }
        @media (max-width: 640px) {
          .proj-controls { padding: 14px 12px 0; }
        }
        .proj-search-wrap {
          position: relative;
          max-width: 560px;
          margin-bottom: 14px;
        }
        .proj-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--clr-text-3);
          font-size: 15px;
          pointer-events: none;
        }
        .proj-filters-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
        }
        @media (max-width: 760px) {
          .proj-filters-wrap {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-x !important;
            padding-bottom: 10px !important;
            scrollbar-width: none !important;
          }
          .proj-filters-wrap::-webkit-scrollbar { display: none !important; }
        }
        .proj-filter-btn {
          flex-shrink: 0;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(99,102,241,0.2);
          background: rgba(255,255,255,0.03);
          color: var(--clr-text-2);
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .proj-filter-btn.active {
          background: rgba(99,102,241,0.25);
          border-color: rgba(99,102,241,0.55);
          color: #c4b5fd;
        }

        /* ─── Layout: main content + sidebar ─── */
        .proj-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 28px;
          padding: 24px 20px 0;
          align-items: start;
          max-width: 1600px;
        }
        @media (max-width: 1100px) {
          .proj-layout {
            grid-template-columns: 1fr;
          }
          .proj-sidebar { display: none !important; }
        }
        @media (max-width: 640px) {
          .proj-layout { padding: 16px 10px 0; gap: 20px; }
        }

        /* ─── Daraz-style product card grid ─── */
        .proj-card-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1400px) {
          .proj-card-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .proj-card-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 760px) {
          .proj-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 360px) {
          .proj-card-grid { gap: 8px !important; }
        }

        /* ─── Individual card ─── */
        .proj-card {
          background: rgba(22, 24, 40, 0.85);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .proj-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 12px 36px rgba(99,102,241,0.18);
        }
        @media (max-width: 760px) {
          .proj-card { border-radius: 10px; }
        }

        /* card thumbnail */
        .proj-card-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          background: rgba(255,255,255,0.03);
          overflow: hidden;
          flex-shrink: 0;
        }
        @media (max-width: 760px) {
          .proj-card-thumb { aspect-ratio: 3 / 2; }
        }

        /* card body */
        .proj-card-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        @media (max-width: 760px) {
          .proj-card-body { padding: 9px 10px 10px; gap: 6px; }
        }

        .proj-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .proj-card-tag {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(99,102,241,0.12);
          color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .proj-card-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--clr-text-1);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 760px) {
          .proj-card-title { font-size: 12.5px; }
        }

        .proj-card-type {
          font-size: 11px;
          color: var(--clr-text-3);
          font-weight: 500;
        }
        @media (max-width: 760px) {
          .proj-card-type { font-size: 10px; }
        }

        /* Price area */
        .proj-card-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: auto;
        }
        .proj-card-price {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 800;
          color: #34d399;
        }
        @media (max-width: 760px) {
          .proj-card-price { font-size: 14px; }
        }
        .proj-card-original {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          text-decoration: line-through;
        }
        @media (max-width: 760px) {
          .proj-card-original { font-size: 10px; }
        }
        .proj-card-discount {
          font-size: 10px;
          font-weight: 800;
          color: #f87171;
          background: rgba(239,68,68,0.12);
          border-radius: 4px;
          padding: 1px 5px;
        }

        /* CTA Button */
        .proj-card-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
          border-radius: 8px;
          color: #ffffff !important;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none !important;
          transition: opacity 0.2s, transform 0.15s;
          min-height: 40px;
          box-sizing: border-box;
        }
        .proj-card-cta:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        @media (max-width: 760px) {
          .proj-card-cta { font-size: 11.5px; padding: 9px; min-height: 36px; border-radius: 7px; }
        }

        /* Discount badge on thumbnail */
        .proj-discount-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #ef4444, #ec4899);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(239,68,68,0.45);
          z-index: 2;
        }

        /* Mobile inline ad */
        .proj-mobile-ad {
          display: none;
        }
        @media (max-width: 1100px) {
          .proj-mobile-ad { display: block; margin: 20px 0; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="proj-hero">
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '999px', padding: '5px 14px', marginBottom: '20px',
              fontSize: '11px', fontWeight: 700, color: '#a5b4fc',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            <span>⚡</span> Premium Code Projects
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 6vw, 50px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '14px',
              color: 'var(--clr-text-1)',
            }}
          >
            Project{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Marketplace
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              color: 'var(--clr-text-2)',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            Ready-to-run projects with full source code, docs & setup guides.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="proj-stats-row"
          >
            {[
              { label: 'Projects', value: projects.length ? `${projects.length}+` : '10+' },
              { label: 'Technologies', value: '10+' },
              { label: 'Helped', value: '100+' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 800, color: 'var(--clr-text-1)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SEARCH + FILTERS ── */}
      <div className="proj-controls">
        <div className="proj-search-wrap">
          <span className="proj-search-icon">🔍</span>
          <input
            className="input-field"
            placeholder="Search projects, technologies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div className="proj-filters-wrap">
          {TECH_FILTERS.map(f => (
            <button
              key={f}
              className={`proj-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="proj-layout">
        {/* Left: cards */}
        <div>
          {/* Mobile ad above grid */}
          <div className="proj-mobile-ad">
            <AdUnit type="banner" slot="projects-mobile-top" />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="proj-card-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0', color: 'var(--clr-text-3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '6px' }}>No projects found</p>
              <p style={{ fontSize: '13px' }}>
                {search ? 'Try a different term or ' : ''}
                <button onClick={() => { setFilter('All'); setSearch('') }} style={{ background: 'none', border: 'none', color: 'var(--clr-primary-h)', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  clear filters
                </button>
              </p>
            </div>
          ) : (
            <div className="proj-card-grid">
              {filtered.map((project, idx) => {
                const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.35) }}
                    className="proj-card"
                  >
                    {/* Thumbnail */}
                    <div className="proj-card-thumb">
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt={project.title}
                          fill
                          unoptimized
                          priority={idx < 6}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' }}>
                          <span style={{ fontSize: '40px', opacity: 0.4 }}>💻</span>
                        </div>
                      )}
                      {/* Bottom gradient */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(transparent, rgba(13,15,26,0.9))' }} />
                      {/* Discount badge */}
                      {project.discountPercentage > 0 && (
                        <div className="proj-discount-badge">
                          -{project.discountPercentage}%
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="proj-card-body">
                      {/* Tech tags */}
                      <div className="proj-card-tags">
                        {project.technologies.split(',').slice(0, 2).map(tech => (
                          <span key={tech} className="proj-card-tag">{tech.trim()}</span>
                        ))}
                        {project.technologies.split(',').length > 2 && (
                          <span className="proj-card-tag" style={{ opacity: 0.6 }}>
                            +{project.technologies.split(',').length - 2}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="proj-card-title">{project.title}</div>

                      {/* Type */}
                      <div className="proj-card-type">full project</div>

                      {/* Price */}
                      <div className="proj-card-price-row">
                        <span className="proj-card-price">Rs. {discountedPrice}</span>
                        {project.discountPercentage > 0 && (
                          <>
                            <span className="proj-card-original">Rs. {project.originalPrice}</span>
                            <span className="proj-card-discount">-{project.discountPercentage}%</span>
                          </>
                        )}
                      </div>

                      {/* CTA */}
                      <Link href={`/projects/${getProjectSlug(project)}`} className="proj-card-cta">
                        View Details →
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Mobile ad below grid */}
          <div className="proj-mobile-ad">
            <AdUnit type="inline" slot="projects-mobile-bottom" />
          </div>
        </div>

        {/* Right: Sidebar Ads (desktop only) */}
        <div className="proj-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '80px' }}>
          <AdUnit type="sidebar" slot="projects-sidebar-1" />
          <AdUnit type="sidebar" slot="projects-sidebar-2" />
        </div>
      </div>
    </main>
  )
}
