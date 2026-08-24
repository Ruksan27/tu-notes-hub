'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-toastify'
import CheckoutModal from '@/components/projects/CheckoutModal'

type Project = {
  id: string
  title: string
  description: string
  technologies: string
  originalPrice: number
  discountPercentage: number
  thumbnailUrl: string | null
  demoUrl: string | null
  features: string | null
}

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // To check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check auth
    const stored = localStorage.getItem('tu_user')
    if (stored) setIsLoggedIn(true)

    // Fetch project
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.project) {
          setProject(data.project)
        } else {
          toast.error('Project not found')
          router.push('/projects')
        }
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load project details')
        setLoading(false)
      })
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!project) return null

  const discountedPrice = Math.round(project.originalPrice * (1 - project.discountPercentage / 100))
  let featuresList: string[] = []
  try {
    if (project.features) {
      featuresList = JSON.parse(project.features)
    }
  } catch {
    featuresList = project.features ? project.features.split('\n') : []
  }

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast.info('Please log in to purchase or inquire about projects')
      router.push('/login')
      return
    }
    setIsModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/projects" className="inline-flex items-center text-slate-400 hover:text-indigo-400 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative h-64 md:h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              {project.thumbnailUrl ? (
                <Image src={project.thumbnailUrl} alt={project.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.split(',').map(tech => (
                  <span key={tech} className="text-sm font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tech.trim()}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{project.title}</h1>
              
              <div className="prose prose-invert max-w-none text-slate-300">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>

            {featuresList.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Key Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuresList.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-slate-300">
                      <svg className="w-6 h-6 text-emerald-500 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Purchase Project</h3>
              
              <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
                {project.discountPercentage > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Original Price</span>
                    <span className="text-slate-500 line-through">Rs. {project.originalPrice}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Final Price</span>
                  <span className="text-3xl font-bold text-emerald-400">Rs. {discountedPrice}</span>
                </div>
                {project.discountPercentage > 0 && (
                  <div className="mt-2 text-right">
                    <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                      Save {project.discountPercentage}%
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleActionClick}
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Get Source Code
                </button>
                
                <button 
                  onClick={handleActionClick}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors border border-slate-700 hover:border-slate-600 flex justify-center items-center"
                >
                  <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  I'm Interested
                </button>

                {project.demoUrl && (
                  <a 
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-transparent hover:bg-slate-800 text-slate-300 font-medium py-3.5 px-4 rounded-xl transition-colors border border-slate-700 flex justify-center items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Live Demo
                  </a>
                )}
              </div>
              
              <p className="text-xs text-slate-500 text-center mt-6">
                Payments are securely processed. Source code and setup guides are provided after verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        finalPrice={discountedPrice}
      />
    </main>
  )
}
