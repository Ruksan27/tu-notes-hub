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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-4"
          >
            Project Marketplace
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Explore pre-built projects, complete with source code and documentation. Ideal for learning or starting your next big assignment.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-xl">No projects available right now.</p>
            <p className="mt-2">Check back later for new additions!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, idx) => {
              const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))
              
              return (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors group flex flex-col"
                >
                  <div className="relative h-48 w-full bg-slate-800">
                    {project.thumbnailUrl ? (
                      <Image 
                        src={project.thumbnailUrl} 
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                    )}
                    {project.discountPercentage > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {project.discountPercentage}% OFF
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.split(',').map(tech => (
                        <span key={tech} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-1">
                      {project.description}
                    </p>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {project.discountPercentage > 0 && (
                          <div className="text-slate-500 text-sm line-through mb-1">
                            Rs. {project.originalPrice}
                          </div>
                        )}
                        <div className="text-2xl font-bold text-emerald-400">
                          Rs. {discountedPrice}
                        </div>
                      </div>
                      
                      <Link 
                        href={`/projects/${project.id}`}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details
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
