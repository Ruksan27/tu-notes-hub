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
    <main className="min-h-screen bg-[#0a0c10] pb-24 font-sans text-slate-200">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
          mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section className="relative px-4 pt-12 pb-8 sm:pt-20 sm:pb-12 text-center border-b border-white/5 bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] sm:w-full max-w-2xl h-64 bg-indigo-500/20 blur-[80px] pointer-events-none rounded-full mix-blend-screen"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-5 sm:mb-6 text-[10px] sm:text-xs font-bold text-indigo-300 tracking-wider uppercase backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <span>⚡</span> Premium Code Projects
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3 sm:mb-4 text-white leading-[1.15]"
          >
            Project{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-sm">
              Marketplace
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed"
          >
            Ready-to-run projects with full source code, extensive documentation, and detailed setup guides.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-2 sm:gap-6 max-w-[300px] sm:max-w-lg mx-auto"
          >
            {[
              { label: 'Projects', value: projects.length ? `${projects.length}+` : '10+' },
              { label: 'Technologies', value: '10+' },
              { label: 'Helped', value: '100+' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center">
                <div className="font-black text-2xl sm:text-3xl lg:text-4xl text-white">{s.value}</div>
                <div className="text-[9px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5 sm:mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SEARCH & FILTERS ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8 mb-6 sm:mb-8">
        <div className="max-w-2xl mb-4 sm:mb-5 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-12 py-3.5 sm:py-4 text-sm sm:text-base text-white outline-none focus:border-cyan-400 focus:bg-slate-800 transition-all shadow-inner"
            placeholder="Search projects, technologies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory mask-fade-edges -mx-4 px-4 sm:mx-0 sm:px-0">
          {TECH_FILTERS.map(f => (
            <button
              key={f}
              className={`snap-start shrink-0 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all border outline-none ${
                filter === f 
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-slate-200'
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (Daraz Style Grid) ── */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Projects Grid */}
        <div className="w-full min-w-0">
          
          {/* Mobile Top Ad */}
          <div className="block xl:hidden mb-5 sm:mb-6 rounded-xl overflow-hidden">
            <AdUnit type="banner" slot="projects-mobile-top" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-slate-800/50 animate-pulse h-[220px] sm:h-[300px] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4 bg-slate-900/40 rounded-3xl border border-white/5">
              <div className="text-4xl sm:text-5xl mb-4 sm:mb-5 opacity-40">🔍</div>
              <h3 className="text-base sm:text-xl font-bold text-slate-200 mb-2">No projects found</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                {search ? 'Try a different search term or ' : ''}
                <button 
                  onClick={() => { setFilter('All'); setSearch('') }} 
                  className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/30 underline-offset-4"
                >
                  clear filters
                </button>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filtered.map((project, idx) => {
                const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.35) }}
                    className="h-full"
                  >
                    <Link 
                      href={`/projects/${getProjectSlug(project)}`} 
                      className="group flex flex-col h-full bg-slate-900/80 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-15px_rgba(99,102,241,0.25)] transition-all duration-300 relative"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] bg-slate-800 overflow-hidden shrink-0">
                        {project.thumbnailUrl ? (
                          <Image
                            src={project.thumbnailUrl}
                            alt={project.title}
                            fill
                            unoptimized
                            priority={idx < 6}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-cyan-500/10">
                            <span className="text-3xl sm:text-5xl opacity-40 group-hover:scale-110 transition-transform duration-500">💻</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 sm:opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                        
                        {/* Discount Badge */}
                        {project.discountPercentage > 0 && (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] sm:text-[11px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-[6px] shadow-lg shadow-rose-500/30 z-10 border border-white/20">
                            -{project.discountPercentage}%
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col flex-1 p-2.5 sm:p-4 gap-1.5 sm:gap-2.5">
                        {/* Tech Tags */}
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {project.technologies.split(',').slice(0, 2).map(tech => (
                            <span key={tech} className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-[3px] rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                              {tech.trim()}
                            </span>
                          ))}
                          {project.technologies.split(',').length > 2 && (
                            <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-[3px] rounded-md bg-white/5 text-slate-400 border border-white/5">
                              +{project.technologies.split(',').length - 2}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-[12px] sm:text-[14px] text-slate-100 line-clamp-2 leading-[1.3] group-hover:text-indigo-300 transition-colors mt-0.5">
                          {project.title}
                        </h3>
                        
                        {/* Type indicator (Mobile minimalist) */}
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mb-auto hidden sm:block">
                          Full Project Source
                        </div>

                        {/* Price Section */}
                        <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 mt-2 sm:mt-1 pt-1.5 border-t border-white/5">
                          <span className="font-black text-emerald-400 text-sm sm:text-lg">
                            Rs. {discountedPrice}
                          </span>
                          {project.discountPercentage > 0 && (
                            <span className="text-[9px] sm:text-xs text-slate-500 line-through font-semibold">
                              Rs. {project.originalPrice}
                            </span>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] sm:text-xs font-black py-1.5 sm:py-2.5 rounded-[8px] sm:rounded-[10px] text-center mt-1.5 shadow-lg shadow-indigo-500/10 group-hover:shadow-cyan-500/30 transition-shadow">
                          View Details
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Mobile Bottom Ad */}
          <div className="block xl:hidden mt-6 sm:mt-8 rounded-xl overflow-hidden">
            <AdUnit type="inline" slot="projects-mobile-bottom" />
          </div>
        </div>

        {/* Right Column: Sidebar Ads */}
        <div className="hidden xl:flex flex-col gap-5 sticky top-24 shrink-0">
          <AdUnit type="sidebar" slot="projects-sidebar-1" />
          <AdUnit type="sidebar" slot="projects-sidebar-2" />
        </div>

      </div>
    </main>
  )
}
