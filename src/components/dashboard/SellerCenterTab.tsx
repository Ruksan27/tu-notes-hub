'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import Image from 'next/image'

interface Project {
  id: string
  title: string
  description: string
  technologies: string
  originalPrice: number
  thumbnailUrl: string | null
  status: string
  adminNote: string | null
  _count?: { orders: number }
}

interface User {
  id: string
  name: string
  email: string
  sellerProfile?: any
}

const EMPTY_FORM = {
  title: '',
  shortDescription: '',
  category: '',
  subcategory: '',
  projectType: '',
  description: '',
  projectObjective: '',
  features: '',
  modules: '',
  requirements: '',
  installation: '',
  limitations: '',
  version: '',
  technologies: '',
  frontend: '',
  backend: '',
  dbType: '',
  framework: '',
  libraries: '',
  originalPrice: 0,
  negotiable: false,
  license: '',
  salesType: '',
  demoUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  sourceDriveLink: '',
  demoCredentials: '',
}

export default function SellerCenterTab({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/9800000000')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  
  // Images
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<(File | null)[]>([null, null, null, null])
  const [screenshotPreviews, setScreenshotPreviews] = useState<(string | null)[]>([null, null, null, null])
  
  // Declaration Checkboxes
  const [declarations, setDeclarations] = useState(new Array(11).fill(false))

  const [saving, setSaving] = useState(false)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const screenRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    if (user.sellerProfile?.status === 'APPROVED') fetchProjects()
    fetchSettings()
  }, [user.sellerProfile?.status])

  async function fetchProjects() {
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/student/seller/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch { /* silent */ }
    finally { setLoadingProjects(false) }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.whatsappLink) setWhatsappLink(data.settings.whatsappLink)
      }
    } catch { /* silent */ }
  }

  function handleImageChange(file: File, type: 'thumb' | 0 | 1 | 2 | 3) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (type === 'thumb') {
        setThumbnailFile(file)
        setThumbnailPreview(result)
      } else {
        const newFiles = [...screenshots]
        newFiles[type] = file
        setScreenshots(newFiles)
        
        const newPreviews = [...screenshotPreviews]
        newPreviews[type] = result
        setScreenshotPreviews(newPreviews)
      }
    }
    reader.readAsDataURL(file)
  }

  function openModal() {
    setFormData(EMPTY_FORM)
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setScreenshots([null, null, null, null])
    setScreenshotPreviews([null, null, null, null])
    setDeclarations(new Array(11).fill(false))
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (declarations.some(d => !d)) {
      toast.error('You must accept all declarations before submitting.')
      return
    }
    if (!thumbnailFile) {
      toast.error('Thumbnail is required.')
      return
    }
    if (!screenshots[0] || !screenshots[1]) {
      toast.error('At least 2 screenshots are required.')
      return
    }
    if (!formData.demoUrl && !formData.youtubeUrl) {
      // Rule says at least Live Demo OR Video OR Screenshots, but since we require screenshots anyway, we pass.
    }

    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v))
      })
      fd.append('sellerDeclared', 'true')
      fd.append('thumbnail', thumbnailFile)
      if (screenshots[0]) fd.append('screenshot1', screenshots[0])
      if (screenshots[1]) fd.append('screenshot2', screenshots[1])
      if (screenshots[2]) fd.append('screenshot3', screenshots[2])
      if (screenshots[3]) fd.append('screenshot4', screenshots[3])

      const res = await fetch('/api/student/seller/projects', { method: 'POST', body: fd })
      const data = await res.json()

      if (res.ok) {
        toast.success('Project submitted! Awaiting admin review 🎉')
        setIsModalOpen(false)
        fetchProjects()
      } else {
        toast.error(data.error || 'Failed to upload project')
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Pending state
  if (user.sellerProfile?.status === 'PENDING') {
    return (
      <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>⏳</div>
        <h4 className="text-2xl font-bold mb-3">Application Under Review</h4>
        <p style={{ color: 'var(--clr-text-2)', maxWidth: '420px', margin: '0 auto' }}>
          Your seller profile is being reviewed. You will receive an email once your account is approved.
        </p>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    ACTIVE: '#6ee7b7',
    PENDING: '#fcd34d',
    CHANGES_REQUESTED: '#f97316',
    HIDDEN: '#94a3b8',
    REJECTED: '#fca5a5',
  }

  return (
    <>
      <div className="glass-card" style={{ padding: '32px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>🏬 Seller Center</h3>
            <p style={{ color: 'var(--clr-text-2)', marginTop: '6px', fontSize: '14px' }}>
              Welcome back, <strong style={{ color: 'var(--clr-primary-h)' }}>{user.name.split(' ')[0]}</strong>! Manage your projects.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <span>💬</span> Chat with Admin
            </a>
            <button className="btn btn-primary" onClick={openModal}>➕ Upload New Project</button>
          </div>
        </div>

        {/* Project List */}
        <h4 className="section-title">My Projects</h4>

        {loadingProjects ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="spinner" style={{ width: '36px', height: '36px' }} /></div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--clr-border)' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📁</span>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '16px' }}>No projects uploaded yet.</p>
            <button className="btn btn-primary btn-sm" onClick={openModal}>Upload Your First Project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {projects.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(13,15,26,0.9)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ height: '150px', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                  {p.thumbnailUrl ? <Image src={p.thumbnailUrl} alt={p.title} fill style={{ objectFit: 'cover' }} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', opacity: 0.1 }}>💻</div>}
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: statusColor[p.status] || '#fff', border: `1px solid ${statusColor[p.status] || '#fff'}40` }}>
                      {p.status === 'ACTIVE' ? '● LIVE' : p.status === 'PENDING' ? '⏳ REVIEW' : p.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--clr-text-1)', margin: 0 }}>{p.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '18px', color: '#6ee7b7' }}>Rs. {p.originalPrice}</span>
                    <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>🛒 {p._count?.orders ?? 0} orders</span>
                  </div>
                  {p.status === 'CHANGES_REQUESTED' && (
                    <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#fed7aa', marginTop: '8px' }}>
                      <strong>Admin Note:</strong> {p.adminNote || 'Please update your project.'}
                    </div>
                  )}
                  {p.status === 'PENDING' && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#fcd34d' }}>
                      ⏳ Awaiting admin approval
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="upload-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          >
            <motion.div
              key="upload-modal"
              initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              style={{ width: '100%', maxWidth: '800px', background: '#0b0c18', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}
            >
              <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0b0c18', zIndex: 10 }}>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--clr-text-1)', margin: 0 }}>➕ Upload New Project</h2>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '3px' }}>Fill all details. Admin will review before it goes live.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: 'var(--clr-text-2)', fontSize: '18px' }}>×</button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Section A */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section A — Basic Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Project Name *</label>
                      <input required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Short Description *</label>
                      <input required className="input-field" value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Category *</label>
                        <input required className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Subcategory</label>
                        <input className="input-field" value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Project Type *</label>
                      <select required className="input-field" value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})}>
                        <option value="">Select type...</option>
                        <option value="Web Application">Web Application</option>
                        <option value="Mobile Application">Mobile Application</option>
                        <option value="Desktop Application">Desktop Application</option>
                        <option value="AI/ML">AI/ML</option>
                        <option value="API">API</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section B */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section B — Complete Project Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Full Description *</label>
                      <textarea required className="input-field" style={{ minHeight: '100px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Project Objective</label>
                      <textarea className="input-field" value={formData.projectObjective} onChange={e => setFormData({...formData, projectObjective: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Features (one per line) *</label>
                      <textarea required className="input-field" placeholder="✓ Admin Login&#10;✓ User Management" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Modules (one per line) *</label>
                      <textarea required className="input-field" placeholder="Admin&#10;User" value={formData.modules} onChange={e => setFormData({...formData, modules: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Requirements *</label>
                      <textarea required className="input-field" value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Installation Process *</label>
                      <textarea required className="input-field" value={formData.installation} onChange={e => setFormData({...formData, installation: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Known Limitations</label>
                        <input className="input-field" value={formData.limitations} onChange={e => setFormData({...formData, limitations: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Version</label>
                        <input className="input-field" placeholder="e.g. 1.0.0" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section C — Technology Stack</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Frontend *</label>
                      <input required className="input-field" placeholder="Next.js + Tailwind" value={formData.frontend} onChange={e => setFormData({...formData, frontend: e.target.value, technologies: [e.target.value, formData.backend, formData.dbType].filter(Boolean).join(', ')})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Backend</label>
                      <input className="input-field" placeholder="Node.js" value={formData.backend} onChange={e => setFormData({...formData, backend: e.target.value, technologies: [formData.frontend, e.target.value, formData.dbType].filter(Boolean).join(', ')})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Database *</label>
                      <input required className="input-field" placeholder="MySQL" value={formData.dbType} onChange={e => setFormData({...formData, dbType: e.target.value, technologies: [formData.frontend, formData.backend, e.target.value].filter(Boolean).join(', ')})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Framework / Libraries</label>
                      <input className="input-field" value={formData.framework} onChange={e => setFormData({...formData, framework: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section D */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section D — Images (Max 2MB each)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Thumbnail *</label>
                      <input type="file" ref={thumbInputRef} accept="image/*" onChange={e => { if(e.target.files?.[0]) handleImageChange(e.target.files[0], 'thumb') }} />
                      {thumbnailPreview && <img src={thumbnailPreview} alt="thumb" style={{ height: '80px', marginTop: '8px', borderRadius: '8px' }} />}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[1, 2, 3, 4].map((num, i) => (
                        <div key={num}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Screenshot {num} {num <= 2 ? '*' : ''}</label>
                          <input type="file" ref={screenRefs[i]} accept="image/*" onChange={e => { if(e.target.files?.[0]) handleImageChange(e.target.files[0], i as any) }} />
                          {screenshotPreviews[i] && <img src={screenshotPreviews[i]!} alt={`sc${num}`} style={{ height: '80px', marginTop: '8px', borderRadius: '8px' }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section E */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section E — Demo Links</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Live Website</label>
                      <input type="url" className="input-field" value={formData.demoUrl} onChange={e => setFormData({...formData, demoUrl: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>YouTube Demo</label>
                      <input type="url" className="input-field" value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} />
                    </div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>GitHub (Must be PRIVATE)</label><input type="url" className="input-field" value={formData.githubUrl} onChange={e => setFormData({...formData, githubUrl: e.target.value})} /></div>
                    <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>LinkedIn</label><input type="url" className="input-field" value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} /></div>
                  </div>
                </div>

                {/* Section F */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section F — Project Files Drive Link</h3>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '10px' }}>Upload a zip with Source Code, Database, and Docs to Google Drive. Grant admin access.</p>
                  <input type="url" required className="input-field" placeholder="https://drive.google.com/..." value={formData.sourceDriveLink} onChange={e => setFormData({...formData, sourceDriveLink: e.target.value})} />
                </div>

                {/* Section G */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section G — Demo Credentials (Optional)</h3>
                  <textarea className="input-field" placeholder="Admin: admin@test.com / 123456" value={formData.demoCredentials} onChange={e => setFormData({...formData, demoCredentials: e.target.value})} />
                </div>

                {/* Section H */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section H — Pricing</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Expected Price (Rs.) *</label>
                      <input type="number" required min={0} className="input-field" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Negotiable? *</label>
                      <select required className="input-field" value={formData.negotiable ? 'Yes' : 'No'} onChange={e => setFormData({...formData, negotiable: e.target.value === 'Yes'})}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section I & J */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section I & J — License and Sales Type</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>License Type</label>
                      <select className="input-field" value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="Academic / Personal">Academic / Personal</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', marginBottom: '8px' }}>Sales Type</label>
                      <select className="input-field" value={formData.salesType} onChange={e => setFormData({...formData, salesType: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="Non-Exclusive">Non-Exclusive</option>
                        <option value="Exclusive">Exclusive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section K */}
                <div>
                  <h3 style={{ fontSize: '16px', color: '#a5b4fc', marginBottom: '16px', borderBottom: '1px solid rgba(165,180,252,0.2)', paddingBottom: '8px' }}>Section K — Seller Declaration</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      "I own or have the right to sell this project.",
                      "The project description and features are accurate.",
                      "The screenshots and demo represent the actual project.",
                      "The technologies and requirements are accurate.",
                      "The files in my provided Drive folder are the actual files intended for sale.",
                      "The source code matches the project listing.",
                      "I have removed passwords, API keys, tokens and other sensitive information from the submitted project.",
                      "If I provide GitHub, the source repository is PRIVATE.",
                      "I understand that TU Notes may download, inspect, verify and store the project files for marketplace delivery.",
                      "I agree to the applicable 20–25% platform commission.",
                      "I agree to TU Notes payment, delivery, refund and dispute policies."
                    ].map((text, idx) => (
                      <label key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--clr-text-2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={declarations[idx]} onChange={e => {
                          const newDecs = [...declarations]
                          newDecs[idx] = e.target.checked
                          setDeclarations(newDecs)
                        }} style={{ marginTop: '3px' }} />
                        {text}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '16px' }}>
                    {saving ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Uploading Project…</> : '🚀 Submit Project for Review'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
