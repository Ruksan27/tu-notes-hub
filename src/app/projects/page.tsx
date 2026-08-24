'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'

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

const TECH_FILTERS = ['All', 'Next.js', 'React', 'Node.js', 'PHP', 'Python', 'Laravel', 'Flutter', 'MongoDB', 'PostgreSQL']

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
    <main style={{ minHeight: '100vh', background: 'var(--clr-bg-900)', paddingBottom: '80px' }}>
      {/* ── HERO SECTION ── */}
      <section style={{
        background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--clr-border)',
        padding: '72px 24px 56px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '999px', padding: '6px 16px', marginBottom: '24px',
              fontSize: '12px', fontWeight: 700, color: '#a5b4fc',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            <span>⚡</span> Premium Code Projects
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 56px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '20px',
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: 'var(--clr-text-2)', fontSize: '17px', lineHeight: 1.7, marginBottom: '36px' }}
          >
            Explore ready-to-run projects with full source code, documentation, and setup guides.
            Perfect for learning, college assignments, or launching your next product.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}
          >
            {[
              { label: 'Projects', value: projects.length + '+' },
              { label: 'Technologies', value: '10+' },
              { label: 'Students Helped', value: '100+' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--clr-text-1)' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 0' }}>
        {/* ── Search & Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: '36px' }}
        >
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '480px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--clr-text-3)', fontSize: '16px', pointerEvents: 'none',
            }}>🔍</span>
            <input
              className="input-field"
              placeholder="Search projects, technologies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TECH_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${filter === f ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.15)'}`,
                  background: filter === f ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: filter === f ? '#a5b4fc' : 'var(--clr-text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Results ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: '380px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--clr-text-3)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>No projects found</p>
            <p style={{ fontSize: '14px' }}>
              {search ? 'Try a different search term or ' : ''}<button onClick={() => { setFilter('All'); setSearch('') }} style={{ background: 'none', border: 'none', color: 'var(--clr-primary-h)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>clear filters</button>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filtered.map((project, idx) => {
              const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))
              const savedAmt = Math.round(project.originalPrice * project.discountPercentage / 100)

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.06, 0.4) }}
                  style={{
                    background: 'rgba(13,15,26,0.9)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.2s',
                  }}
                  whileHover={{ scale: 1.015, boxShadow: '0 12px 40px rgba(99,102,241,0.15)' }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', height: '190px', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
                    {project.thumbnailUrl ? (
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.title}
                        fill
                        style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '56px', opacity: 0.15 }}>💻</span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                      background: 'linear-gradient(transparent, rgba(13,15,26,0.9))',
                    }} />

                    {/* Discount badge */}
                    {project.discountPercentage > 0 && (
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                        color: '#fff', fontSize: '11px', fontWeight: 800,
                        padding: '4px 10px', borderRadius: '999px',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                      }}>
                        {project.discountPercentage}% OFF
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Tech tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {project.technologies.split(',').slice(0, 3).map(tech => (
                        <span key={tech} style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                          background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                          border: '1px solid rgba(99,102,241,0.22)',
                        }}>
                          {tech.trim()}
                        </span>
                      ))}
                      {project.technologies.split(',').length > 3 && (
                        <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', padding: '2px 4px' }}>
                          +{project.technologies.split(',').length - 3} more
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--clr-text-1)', lineHeight: 1.25 }}>
                      {project.title}
                    </h3>

                    <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', lineHeight: 1.6, flex: 1 }}>
                      {project.description.slice(0, 110)}{project.description.length > 110 ? '…' : ''}
                    </p>

                    {/* Price block */}
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        {project.discountPercentage > 0 && (
                          <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', textDecoration: 'line-through', marginBottom: '1px' }}>
                            Rs. {project.originalPrice}
                          </div>
                        )}
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#6ee7b7' }}>
                          Rs. {discountedPrice}
                        </div>
                      </div>
                      {project.discountPercentage > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-3)' }}>You save</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5' }}>Rs. {savedAmt}</div>
                        </div>
                      )}
                    </div>

                    {/* Popularity / CTA */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '2px' }}>
                      {project._count && project._count.orders > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>
                          🛒 {project._count.orders} sold
                        </span>
                      )}
                      <Link
                        href={`/projects/${project.id}`}
                        style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                          borderRadius: '10px',
                          fontWeight: 700, fontSize: '14px', color: '#fff',
                          textDecoration: 'none',
                          transition: 'opacity 0.2s, transform 0.15s',
                          boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        }}
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
