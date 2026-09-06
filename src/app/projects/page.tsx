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
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg-900)', color: 'var(--clr-text-1)', paddingBottom: '80px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .projects-hero {
          position: relative;
          padding: 50px 20px 36px;
          text-align: center;
          background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.03) 60%, transparent 100%);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          width: 100%;
        }

        .project-card {
          background: var(--clr-bg-800);
          border: 1px solid var(--clr-border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          text-decoration: none;
          color: inherit;
        }
        .project-card:hover {
          transform: translateY(-4px);
          border-color: var(--clr-border-h);
          box-shadow: 0 12px 30px rgba(99,102,241,0.2);
        }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Daraz Style 2-by-2 Mobile Grid ── */
        @media (max-width: 640px) {
          .projects-hero { padding: 28px 12px 20px; }
          .projects-container { padding: 20px 10px !important; }
          .projects-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .project-card {
            border-radius: 12px !important;
          }
          .project-card-body {
            padding: 10px 8px !important;
          }
          .project-card-desc {
            display: none !important;
          }
          .project-card-title {
            font-size: 13px !important;
            line-height: 1.3 !important;
            margin-bottom: 6px !important;
          }
          .project-card-price {
            font-size: 14px !important;
          }
          .project-card-cta {
            padding: 5px 8px !important;
            font-size: 10.5px !important;
            border-radius: 6px !important;
          }
        }
      `}} />

      {/* ── HERO SECTION ── */}
      <section className="projects-hero">
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '999px',
              padding: '4px 14px',
              marginBottom: '16px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#a5b4fc',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}
          >
            <span>⚡</span> Premium Code Projects
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              fontSize: 'clamp(30px, 5.5vw, 52px)',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.15,
              marginBottom: '12px'
            }}
          >
            Project <span className="text-gradient">Marketplace</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              color: 'var(--clr-text-2)',
              fontSize: 'clamp(14px, 3vw, 17px)',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}
          >
            Ready-to-run projects with full source code, database scripts, and complete documentation.
          </motion.p>

          {/* Stats Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '440px',
              margin: '0 auto'
            }}
          >
            {[
              { label: 'Projects', value: projects.length ? `${projects.length}+` : '10+' },
              { label: 'Technologies', value: '10+' },
              { label: 'Helped', value: '100+' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="projects-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 20px' }}>
        
        {/* Search & Filter Bar */}
        <div style={{ marginBottom: '36px' }}>
          {/* Search Box */}
          <div style={{ maxWidth: '600px', margin: '0 auto 20px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--clr-text-3)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search projects, technologies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--clr-border)',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}
            />
          </div>

          {/* Tech Filter Pills */}
          <div 
            className="hide-scroll"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '6px',
              justifyContent: 'center',
              maxWidth: '100%'
            }}
          >
            {TECH_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: filter === f ? '1px solid #6366f1' : '1px solid var(--clr-border)',
                  background: filter === f ? 'var(--grad-brand)' : 'rgba(255,255,255,0.03)',
                  color: filter === f ? '#fff' : 'var(--clr-text-2)',
                  boxShadow: filter === f ? '0 4px 14px rgba(99,102,241,0.35)' : 'none'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── PROJECTS GRID ── */}
        {loading ? (
          <div className="projects-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '320px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--clr-border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--clr-border)', maxWidth: '600px', margin: '0 auto' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>🔍</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>No projects found</h3>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>
              {search ? 'Try adjusting your search filters or ' : ''}
              <button
                onClick={() => { setFilter('All'); setSearch('') }}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                view all projects
              </button>
            </p>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map((project, idx) => {
              const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                >
                  <Link 
                    href={`/projects/${getProjectSlug(project)}`}
                    className="project-card"
                  >
                    {/* Thumbnail Image */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', background: '#090a14', overflow: 'hidden' }}>
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt={project.title}
                          fill
                          unoptimized
                          priority={idx < 4}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' }}>
                          <span style={{ fontSize: '36px', opacity: 0.4 }}>💻</span>
                        </div>
                      )}

                      {/* Discount Badge */}
                      {project.discountPercentage > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                          zIndex: 2
                        }}>
                          -{project.discountPercentage}% OFF
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="project-card-body" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Tech Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {project.technologies.split(',').slice(0, 2).map(tech => (
                          <span 
                            key={tech}
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              background: 'rgba(99,102,241,0.12)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99,102,241,0.2)'
                            }}
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h2 className="project-card-title" style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.35, color: '#fff' }}>
                        {project.title}
                      </h2>

                      {/* Short Description (Hidden on Mobile for Daraz style compact 2x2 grid) */}
                      <p className="project-card-desc" style={{ fontSize: '13px', color: 'var(--clr-text-3)', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                        {project.description ? (project.description.length > 90 ? project.description.substring(0, 90) + '...' : project.description) : 'Full source code with complete documentation.'}
                      </p>

                      {/* Pricing & CTA Row */}
                      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <div>
                          <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--clr-text-3)', letterSpacing: '0.4px' }}>Price</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                            <span className="project-card-price" style={{ fontSize: '17px', fontWeight: 900, color: '#10b981' }}>
                              Rs. {discountedPrice}
                            </span>
                            {project.discountPercentage > 0 && (
                              <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                                Rs. {project.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="project-card-cta" style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'var(--grad-brand)',
                          color: '#fff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                          whiteSpace: 'nowrap'
                        }}>
                          View →
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── BOTTOM AD UNIT ── */}
        <div style={{ marginTop: '48px' }}>
          <AdUnit type="inline" slot="projects-bottom-banner" />
        </div>

      </div>
    </div>
  )
}
