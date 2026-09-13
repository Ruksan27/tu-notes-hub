'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { Package, CheckCircle2, ShoppingCart, Clock, Pencil, EyeOff, Eye, Trash2, FolderCode, Rocket, Plus, ExternalLink, Code2, Layers, ShieldCheck, FileText, Sparkles, X } from 'lucide-react'
interface ProjectItem {
  id: string
  title: string
  shortDescription?: string | null
  description: string
  category?: string | null
  subcategory?: string | null
  projectType?: string | null
  projectObjective?: string | null
  modules?: string | null
  requirements?: string | null
  installation?: string | null
  limitations?: string | null
  version?: string | null
  features: string | null
  technologies: string
  frontend?: string | null
  backend?: string | null
  dbType?: string | null
  framework?: string | null
  libraries?: string | null
  originalPrice: number
  discountPercentage: number
  negotiable?: boolean
  license?: string | null
  salesType?: string | null
  thumbnailUrl: string | null
  screenshot1?: string | null
  screenshot2?: string | null
  screenshot3?: string | null
  screenshot4?: string | null
  demoUrl: string | null
  youtubeUrl: string | null
  tiktokUrl?: string | null
  instagramUrl?: string | null
  githubUrl?: string | null
  sourceDriveLink: string | null
  adminDriveLink: string | null
  demoCredentials?: string | null
  adminNote?: string | null
  views?: number
  organicViews?: number
  searchClicks?: number
  user: { id: string; name: string; email?: string } | null
  aiCalculatedPrice?: number | null
  aiComplexityGrade?: string | null
  aiValuationJson?: string | null
  _count?: { orders: number }
  status: string
  createdAt?: string
}

interface ProjectOrder {
  id: string
  user: { name: string; email: string }
  projectItem: { title: string; sourceDriveLink?: string | null; adminDriveLink?: string | null }
  status: string
  transactionId: string | null
  amount: number
  message: string | null
  screenshotUrl: string | null
  orderEmail?: string | null
  createdAt: string
}

interface Props {
  externalSubTab?: 'ITEMS' | 'ORDERS' | 'CARTS'
}

const EMPTY_FORM = {
  title: '',
  description: '',
  technologies: '',
  originalPrice: 0,
  discountPercentage: 0,
  thumbnailUrl: '',
  demoUrl: '',
  youtubeUrl: '',
  sourceDriveLink: '',
  adminDriveLink: '',
  features: '',
}

const LABEL_CLS = 'block text-[11px] font-bold uppercase tracking-widest text-text3 mb-2.5'
const INPUT_CLS = 'w-full bg-bg900 border border-border rounded-xl px-4 py-3 text-sm text-text1 placeholder:text-text3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all'

export default function AdminProjectsTab({ externalSubTab }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'ITEMS' | 'ORDERS' | 'CARTS'>(externalSubTab ?? 'ITEMS')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [orders, setOrders] = useState<ProjectOrder[]>([])
  const [carts, setCarts] = useState<any[]>([])
  const [cartsLoading, setCartsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editAdminLinkId, setEditAdminLinkId] = useState<string | null>(null)
  const [editAdminLink, setEditAdminLink] = useState('')
  const [savingAdminLink, setSavingAdminLink] = useState(false)
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null)

  // AI Valuation State for Marketplace Projects
  const [evaluatingPrice, setEvaluatingPrice] = useState(false)
  const [aiValuationResult, setAiValuationResult] = useState<any>(null)

  async function handleEvaluateProjectPrice() {
    if (!formData.title && !formData.description && !formData.technologies) {
      toast.error('Please enter a Project Title, Description, or Technologies first!')
      return
    }

    setEvaluatingPrice(true)
    const toastId = toast.loading('🤖 AI is evaluating project complexity & calculating fair price...')

    try {
      const res = await fetch('/api/ai/project-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: editingProject?.id,
          title: formData.title,
          description: formData.description,
          technologies: formData.technologies,
          sourceDriveLink: formData.sourceDriveLink,
          adminDriveLink: formData.adminDriveLink,
          features: formData.features,
          demoUrl: formData.demoUrl,
          youtubeUrl: formData.youtubeUrl,
          originalPrice: formData.originalPrice,
          discountPercentage: formData.discountPercentage
        })
      })

      const data = await res.json()
      toast.dismiss(toastId)

      if (res.ok && data.appraisal) {
        setAiValuationResult(data.appraisal)
        setFormData(f => ({
          ...f,
          originalPrice: data.appraisal.calculatedPriceNpr
        }))
        toast.success(`✨ Fair Price Calculated: Rs. ${data.appraisal.calculatedPriceNpr} (${data.appraisal.complexityGrade})`)
      } else {
        toast.error(data.error || 'Failed to evaluate price')
      }
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.error(err.message || 'Network error during valuation')
    } finally {
      setEvaluatingPrice(false)
    }
  }

  useEffect(() => {
    if (externalSubTab) setActiveSubTab(externalSubTab)
  }, [externalSubTab])

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (activeSubTab === 'CARTS') {
      setCartsLoading(true)
      fetch('/api/admin/carts').then(r => r.json()).then(d => {
        setCarts(d.carts || [])
      }).catch(() => {}).finally(() => setCartsLoading(false))
    }
  }, [activeSubTab])

  async function fetchData() {
    setLoading(true)
    try {
      const [projRes, ordRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/projects/orders'),
      ])
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data.projects || [])
      }
      if (ordRes.ok) {
        const data = await ordRes.json()
        setOrders(data.orders || [])
      }
    } catch {
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingProject(null)
    setFormData(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  function openEditModal(p: ProjectItem) {
    setEditingProject(p)
    setFormData({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
      originalPrice: p.originalPrice,
      discountPercentage: p.discountPercentage,
      thumbnailUrl: p.thumbnailUrl ?? '',
      demoUrl: p.demoUrl ?? '',
      youtubeUrl: p.youtubeUrl ?? '',
      sourceDriveLink: p.sourceDriveLink ?? '',
      adminDriveLink: p.adminDriveLink ?? '',
      features: (() => {
        try { return p.features ? JSON.parse(p.features).join('\n') : '' } catch { return p.features ?? '' }
      })(),
    })
    setImageFile(null)
    setImagePreview(p.thumbnailUrl ?? null)
    setIsModalOpen(true)
  }

  function handleImageChange(file: File) {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    setFormData(f => ({ ...f, thumbnailUrl: '' }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const featuresJson = formData.features
        ? JSON.stringify(formData.features.split('\n').map(s => s.trim()).filter(Boolean))
        : null

      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description)
      fd.append('technologies', formData.technologies)
      fd.append('originalPrice', String(formData.originalPrice))
      fd.append('discountPercentage', String(formData.discountPercentage))
      fd.append('demoUrl', formData.demoUrl)
      fd.append('youtubeUrl', formData.youtubeUrl)
      fd.append('sourceDriveLink', formData.sourceDriveLink)
      fd.append('adminDriveLink', formData.adminDriveLink)
      if (featuresJson) fd.append('features', featuresJson)
      if (imageFile) {
        fd.append('thumbnail', imageFile)
      } else {
        fd.append('thumbnailUrl', formData.thumbnailUrl)
      }

      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : '/api/admin/projects'
      const method = editingProject ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: fd })

      if (res.ok) {
        toast.success(editingProject ? 'Project updated! ✅' : 'Project published! 🚀')
        setIsModalOpen(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save project')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function updateProjectStatusAdmin(id: string, newStatus: string, requireNote = false) {
    let adminNote = undefined
    if (requireNote) {
      const note = window.prompt('Enter reason for requesting changes:')
      if (note === null) return
      if (!note.trim()) { toast.error('Note is required'); return }
      adminNote = note.trim()
    }
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...(adminNote && { adminNote }) })
      })
      if (res.ok) { toast.success('Project status updated'); fetchData() }
      else toast.error('Failed to update status')
    } catch { toast.error('Network error') }
  }

  async function toggleProjectStatus(p: ProjectItem) {
    const newStatus = p.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE'
    try {
      const res = await fetch(`/api/admin/projects/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) { toast.success(`Project ${newStatus === 'ACTIVE' ? 'published' : 'hidden'}`); fetchData() }
    } catch { toast.error('Failed to update status') }
  }

  async function handleAdminSaveDeliveryLink(projectId: string) {
    if (!editAdminLink.trim()) { toast.error('Please enter a Google Drive link.'); return }
    if (!editAdminLink.includes('drive.google.com')) { toast.error('Only Google Drive links are accepted.'); return }
    setSavingAdminLink(true)
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminDriveLink: editAdminLink.trim() })
      })
      if (res.ok) {
        toast.success('Admin delivery link saved! ✅')
        setEditAdminLinkId(null)
        setEditAdminLink('')
        fetchData()
      } else toast.error('Failed to save delivery link')
    } catch { toast.error('Network error') }
    finally { setSavingAdminLink(false) }
  }

  async function deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Project deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch { toast.error('Network error') }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch('/api/admin/projects/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) { toast.success(`Order marked as ${status}`); fetchData() }
      else toast.error('Failed to update status')
    } catch { toast.error('Network error') }
  }

  const calcDiscounted = (orig: number, pct: number) =>
    pct > 0 ? Math.round(orig * (1 - pct / 100)) : orig
  const saved = (orig: number, pct: number) => Math.round(orig * pct / 100)

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 w-full pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          <div className="text-[11px] font-bold text-brand uppercase tracking-[1.2px] mb-1">
            Admin Control Center
          </div>
          <h2 className="text-3xl font-extrabold text-text1 tracking-tight">
            Projects Market
          </h2>
        </div>
        <p className="sm:hidden text-xs text-text3">Manage projects, track orders & abandoned carts.</p>
        <button
          onClick={openAddModal}
          className="btn btn-primary"
        >
          <Package size={16} />
          Add Project
        </button>
      </div>

      {/* ── Stats Row (SaaS Minimalist) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, icon: <Package size={18} /> },
          { label: 'Active / Visible', value: projects.filter(p => p.status === 'ACTIVE').length, icon: <CheckCircle2 size={18} className="text-success" /> },
          { label: 'Total Orders', value: orders.length, icon: <ShoppingCart size={18} /> },
          { label: 'Pending Review', value: pendingOrders, icon: <Clock size={18} className="text-warning" /> },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-text3">
              <div className="text-[11px] uppercase tracking-wider font-semibold">{s.label}</div>
              {s.icon}
            </div>
            <div className="text-3xl font-bold text-text1 leading-none">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Sub-tab Switcher (Separate Buttons) ── */}
      <div className="flex flex-wrap gap-3 mt-2.5">
        {(['ITEMS', 'ORDERS', 'CARTS'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              activeSubTab === t
                ? 'bg-brand text-white border-brand shadow-[0_4px_15px_rgba(99,102,241,0.35)]'
                : 'glass-card text-text2 hover:text-text1 hover:border-brand/30'
            }`}
          >
            {t === 'ITEMS' ? '📦 Projects' : t === 'ORDERS' ? '🛒 Orders' : '🛍️ Carts'}
            {t === 'ORDERS' && pendingOrders > 0 && (
              <span className="ml-1 bg-danger text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-sm">
                {pendingOrders}
              </span>
            )}
          </button>
        ))}
      </div>


      {/* ── ITEMS TAB ── */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'ITEMS' && (
          <motion.div key="items" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-white/5 text-slate-400">
                <div className="text-5xl mb-4 opacity-40">📦</div>
                <p className="text-base font-semibold text-slate-300 mb-1">No projects yet</p>
                <p className="text-sm">Click "Add New Project" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {projects.map(p => {
                  const finalPrice = calcDiscounted(p.originalPrice, p.discountPercentage)
                  const savedAmt = saved(p.originalPrice, p.discountPercentage)
                  const views = p.views || 0
                  const organicViews = p.organicViews || 0
                  const sales = p._count ? p._count.orders : 0
                  const conversionRate = views > 0 ? ((sales / views) * 100).toFixed(1) : '0'
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col glass-card overflow-hidden group hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-44 bg-bg900 shrink-0 border-b border-border">
                        {p.thumbnailUrl ? (
                          <Image src={p.thumbnailUrl} alt={p.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/5 to-cyan-500/5">
                            <Package size={48} className="text-text3 opacity-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg900 via-bg900/20 to-transparent" />

                        {/* Status pill */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${
                            p.status === 'ACTIVE'
                              ? 'bg-success/20 border-success/30 text-success'
                              : p.status === 'PENDING'
                              ? 'bg-warning/20 border-warning/30 text-warning'
                              : 'bg-bg800/80 border-border text-text3'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-success animate-pulse' : p.status === 'PENDING' ? 'bg-warning' : 'bg-text3'}`} />
                            {p.status === 'ACTIVE' ? 'LIVE' : p.status === 'PENDING' ? 'REVIEW' : p.status}
                          </span>
                        </div>

                        {/* Discount badge */}
                        {p.discountPercentage > 0 && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-rose-500/20">
                            -{p.discountPercentage}%
                          </div>
                        )}

                        {/* Seller tag */}
                        <div className="absolute bottom-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1 rounded-full backdrop-blur-md border ${
                            p.user ? 'bg-brand/80 border-brand/50 text-white' : 'bg-bg800/80 border-border text-text2'
                          }`}>
                            {p.user ? <><div className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"/></div> {p.user.name}</> : <><CheckCircle2 size={12} className="text-brand"/> Admin</>}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col flex-1 p-5 gap-4">

                        {/* Title + Tech tags */}
                        <div>
                          <h3 className="font-bold text-lg text-text1 leading-snug mb-2.5 group-hover:text-brand transition-colors">{p.title}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {p.technologies.split(',').slice(0, 4).map(t => (
                              <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-bg800 text-text2 border border-border uppercase tracking-wide">
                                {t.trim()}
                              </span>
                            ))}
                            {p.technologies.split(',').length > 4 && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-bg800/50 text-text3 border border-border/50">
                                +{p.technologies.split(',').length - 4}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price row */}
                        <div className="flex items-center justify-between bg-bg800 border border-border rounded-xl px-4 py-3">
                          <div>
                            {p.discountPercentage > 0 && (
                              <div className="text-[11px] text-text3 line-through mb-0.5 font-medium">Rs. {p.originalPrice}</div>
                            )}
                            <div className="font-black text-2xl text-success leading-none">Rs. {finalPrice}</div>
                          </div>
                          {p.discountPercentage > 0 && (
                            <div className="text-right">
                              <div className="text-[9px] text-text3 uppercase tracking-widest font-bold mb-0.5">You Save</div>
                              <div className="text-sm font-bold text-rose-400">Rs. {savedAmt}</div>
                            </div>
                          )}
                        </div>

                        {/* Analytics 3-col */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Views', value: views, sub: organicViews ? `${organicViews} org` : null, color: 'text-sky-400' },
                            { label: 'Sales', value: sales, sub: null, color: 'text-emerald-400' },
                            { label: 'Conv %', value: `${conversionRate}%`, sub: null, color: 'text-brand' },
                          ].map(stat => (
                            <div key={stat.label} className="flex flex-col">
                              <div className="text-[9px] text-text3 uppercase tracking-widest font-semibold mb-1">{stat.label}</div>
                              <div className={`text-base font-bold ${stat.color} leading-none`}>{stat.value}</div>
                              {stat.sub && <div className="text-[9px] text-text3 mt-1 font-medium">{stat.sub}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        {['PENDING', 'CHANGES_REQUESTED'].includes(p.status) ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <button onClick={() => setPreviewProject(p)}
                              className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg bg-brand/10 text-brand border border-brand/25 hover:bg-brand/20 active:scale-95 transition-all">
                              <Eye size={14} /> Preview Full Details
                            </button>
                            <button onClick={() => updateProjectStatusAdmin(p.id, 'ACTIVE')}
                              className="w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-lg bg-success/15 text-success border border-success/30 hover:bg-success/25 active:scale-95 transition-all">
                              <CheckCircle2 size={16} /> Approve & Publish
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => updateProjectStatusAdmin(p.id, 'CHANGES_REQUESTED', true)}
                                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25 active:scale-95 transition-all">
                                <Pencil size={14} /> Request Changes
                              </button>
                              <button onClick={() => updateProjectStatusAdmin(p.id, 'REJECTED')}
                                className="flex items-center justify-center text-xs font-bold py-2.5 px-3 rounded-lg bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 active:scale-95 transition-all">
                                <Trash2 size={14} /> Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 mt-1">
                            <button onClick={() => setPreviewProject(p)}
                              className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg bg-brand/10 text-brand border border-brand/25 hover:bg-brand/20 active:scale-95 transition-all">
                              <Eye size={14} /> Preview Full Details
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => openEditModal(p)}
                                className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg bg-bg800 text-text2 border border-border hover:text-text1 hover:border-brand/30 active:scale-95 transition-all">
                                <Pencil size={14} /> Edit
                              </button>
                              <button onClick={() => toggleProjectStatus(p)}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg border active:scale-95 transition-all ${
                                  p.status === 'ACTIVE'
                                    ? 'bg-warning/10 text-warning border-warning/25 hover:bg-warning/20'
                                    : 'bg-success/10 text-success border-success/25 hover:bg-success/20'
                                }`}>
                                {p.status === 'ACTIVE' ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                              </button>
                              <button onClick={() => deleteProject(p.id)}
                                className="w-10 flex items-center justify-center rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:scale-95 transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* AI Valuation Report */}
                        {p.aiValuationJson && (
                          <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 mt-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5"><Rocket size={12}/> AI Valuation</span>
                              <span className="text-[10px] font-black text-white bg-brand px-2 py-0.5 rounded-md">{p.aiComplexityGrade}</span>
                            </div>
                            {(() => {
                              try {
                                const ai = JSON.parse(p.aiValuationJson)
                                return (
                                  <div className="text-xs text-text2 space-y-1">
                                    <p><span className="text-text3">Suggested:</span> Rs. {ai.suggestedRange?.min} - {ai.suggestedRange?.max}</p>
                                    <div className="mt-1">
                                      <span className="text-text3 text-[10px] uppercase font-bold">Why this price?</span>
                                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[11px] text-text2/80">
                                        {ai.justificationList?.map((j: string, i: number) => <li key={i}>{j}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                )
                              } catch (e) { return null }
                            })()}
                          </div>
                        )}

                        {/* Drive Links */}
                        <div className="space-y-3 pt-4 border-t border-border mt-1">
                          
                          {/* Seller Source */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-text3 uppercase tracking-widest w-16 shrink-0">Seller</span>
                            {p.sourceDriveLink ? (
                              <a href={p.sourceDriveLink} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-lg hover:bg-brand/20 transition-all">
                                <FolderCode size={12} /> Verify Source
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-danger bg-danger/10 border border-danger/20 px-3 py-1.5 rounded-lg">
                                <Clock size={12} /> Not uploaded
                              </span>
                            )}
                          </div>

                          {/* Delivery Link */}
                          {editAdminLinkId === p.id ? (
                            <div className="bg-bg800 border border-brand/30 rounded-xl p-3 space-y-2.5">
                              <label className="text-[10px] text-brand font-bold uppercase tracking-widest flex items-center gap-1.5"><Rocket size={12}/> Admin Delivery Link</label>
                              <input
                                type="url"
                                className="w-full bg-bg900 border border-border rounded-lg px-3 py-2 text-xs text-text1 outline-none focus:border-brand transition-all placeholder:text-text3"
                                value={editAdminLink}
                                onChange={e => setEditAdminLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button className="flex-1 text-[10px] font-semibold py-2 rounded-lg bg-bg800 text-text3 border border-border hover:text-text2 transition-all" onClick={() => setEditAdminLinkId(null)}>Cancel</button>
                                <button
                                  className="flex-[2] text-[10px] font-semibold py-2 rounded-lg bg-brand/20 text-brand border border-brand/30 hover:bg-brand/30 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                  disabled={savingAdminLink}
                                  onClick={() => handleAdminSaveDeliveryLink(p.id)}
                                >
                                  {savingAdminLink ? <Clock size={12} className="animate-spin" /> : <Rocket size={12} />} {savingAdminLink ? 'Saving...' : 'Save Link'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-text3 uppercase tracking-widest w-16 shrink-0">Delivery</span>
                              {p.adminDriveLink ? (
                                <a href={p.adminDriveLink} target="_blank" rel="noreferrer"
                                  className="flex-1 inline-flex items-center gap-1.5 text-[10px] font-semibold text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg hover:bg-warning/20 transition-all truncate min-w-0">
                                  <Rocket size={12} className="shrink-0" /> <span className="truncate">Delivery Link</span>
                                </a>
                              ) : (
                                <span className="flex-1 inline-flex items-center gap-1.5 text-[10px] font-semibold text-text3 bg-bg800 border border-border px-3 py-1.5 rounded-lg min-w-0">
                                  <Clock size={12} /> Not set yet
                                </span>
                              )}
                              <button
                                className={`shrink-0 flex items-center justify-center text-[10px] font-semibold w-8 h-8 rounded-lg border transition-all ${
                                  p.adminDriveLink
                                    ? 'bg-bg800 text-text2 border-border hover:text-brand hover:border-brand/30'
                                    : 'bg-brand/10 text-brand border-brand/20 hover:bg-brand/20'
                                }`}
                                onClick={() => { setEditAdminLinkId(p.id); setEditAdminLink(p.adminDriveLink || '') }}
                              >
                                {p.adminDriveLink ? <Pencil size={12} /> : <Plus size={14} />}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeSubTab === 'ORDERS' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3.5">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#0f101d] rounded-3xl border border-white/5 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-3xl mb-3">🛒</div>
                <p className="text-base font-bold text-slate-300">No orders or inquiries yet</p>
                <p className="text-xs text-slate-500 mt-1">Customer purchases and inquiries will appear here.</p>
              </div>
            ) : (
              orders.map(o => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f101d] border border-white/8 rounded-2xl p-4 sm:p-5 hover:border-indigo-500/30 transition-all shadow-xl"
                >
                  {/* Order Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {o.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-white text-sm truncate">{o.user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{o.user.email}</p>
                        {(o as any).orderEmail && (
                          <p className="text-xs text-indigo-400 font-medium mt-0.5 flex items-center gap-1">📧 {(o as any).orderEmail}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {o.transactionId
                        ? <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">💳 PURCHASE</span>
                        : <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">💬 INQUIRY</span>
                      }
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${
                        o.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                        o.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                        'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {o.status === 'APPROVED' ? '✓ APPROVED' : o.status === 'REJECTED' ? '✗ REJECTED' : '⏳ PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Project Name Card */}
                  <div className="bg-black/30 rounded-xl p-3.5 mb-3.5 border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Target Project</p>
                    <p className="font-extrabold text-indigo-300 text-sm leading-snug">{o.projectItem.title}</p>
                    {o.projectItem.adminDriveLink ? (
                      <a href={o.projectItem.adminDriveLink} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold mt-1.5 inline-flex items-center gap-1">
                        🚀 Delivery Link Set ✓
                      </a>
                    ) : o.projectItem.sourceDriveLink ? (
                      <span className="text-xs text-orange-400 font-medium mt-1.5 flex items-center gap-1">
                        ⚠️ Seller link exists but no delivery link set
                      </span>
                    ) : (
                      <span className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                        ❌ No drive link — set link before approving!
                      </span>
                    )}
                  </div>

                  {/* Payment / Message & Amount */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="text-xs text-slate-400 space-y-1 flex-1 min-w-0">
                      {o.transactionId ? (
                        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                          <span className="text-slate-500 font-semibold">Transaction Ref: </span>
                          <code className="text-indigo-300 text-[11px] font-mono break-all">{o.transactionId}</code>
                          {o.screenshotUrl && (
                            <a href={o.screenshotUrl} target="_blank" rel="noreferrer" className="block text-cyan-400 hover:text-cyan-300 font-semibold underline mt-1 text-xs">
                              📷 View Payment Screenshot
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                          <p className="text-slate-300 italic line-clamp-2">{o.message?.slice(0, 100)}{o.message && o.message.length > 100 ? '…' : ''}</p>
                        </div>
                      )}
                      <p className="text-slate-500 text-[10px] font-semibold mt-1">
                        📅 Date: {new Date(o.createdAt).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {o.amount > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Amount</span>
                        <span className="font-black text-emerald-400 text-xl">Rs. {o.amount}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {o.status === 'PENDING' && (
                    <div className="flex gap-2.5 mt-3.5 pt-3.5 border-t border-white/5">
                      <button
                        onClick={() => updateOrderStatus(o.id, 'APPROVED')}
                        className="flex-1 text-xs font-black py-2.5 px-4 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                      >
                        ✓ Approve Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(o.id, 'REJECTED')}
                        className="flex-1 text-xs font-black py-2.5 px-4 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 active:scale-95 transition-all shadow-md shadow-rose-500/10"
                      >
                        ✗ Reject Order
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── CARTS TAB ── */}
        {activeSubTab === 'CARTS' && (
          <motion.div key="carts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                🛍️
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Cart Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time list of users who added projects to their cart but have not checked out yet.
                </p>
              </div>
            </div>

            {cartsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : carts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#0f101d] rounded-3xl border border-white/5 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-3xl mb-3">🛒</div>
                <p className="text-slate-300 font-bold">No active carts found.</p>
                <p className="text-xs text-slate-500 mt-1">Active cart items will show up here.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {carts.map((cart: any) => {
                  const totalValue = cart.items.reduce((sum: number, item: any) => {
                    const price = Math.floor(item.projectItem.originalPrice * (1 - item.projectItem.discountPercentage / 100))
                    return sum + price
                  }, 0)
                  return (
                    <div key={cart.id} className="bg-[#0f101d] border border-white/8 rounded-2xl p-4 sm:p-5 hover:border-indigo-500/30 transition-all shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                            {cart.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-white text-sm truncate">{cart.user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{cart.user.email}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Cart Potential</span>
                          <span className="font-black text-xl text-emerald-400">Rs. {totalValue}</span>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          <span>Items in Cart ({cart.items.length})</span>
                          <span>Price</span>
                        </div>
                        {cart.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-xs gap-3 py-1 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                              <span className="text-slate-200 font-medium truncate">{item.projectItem.title}</span>
                            </div>
                            <span className="font-black text-emerald-400 shrink-0">
                              Rs. {Math.floor(item.projectItem.originalPrice * (1 - item.projectItem.discountPercentage / 100))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-semibold">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">🛒 Cart Pending</span>
                        <span>Last updated: {new Date(cart.updatedAt).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ADD / EDIT PROJECT MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg900/80 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          >
            <motion.div
              key="modal-box"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full sm:max-w-2xl glass-card rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-brand/10 hide-scrollbar"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-bg900/80 backdrop-blur-xl z-20 flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h2 className="font-bold text-xl text-text1 flex items-center gap-2">
                    {editingProject ? <Pencil size={20} className="text-brand"/> : <Plus size={20} className="text-brand"/>}
                    {editingProject ? 'Edit Project' : 'Add New Project'}
                  </h2>
                  <p className="text-xs text-text3 mt-1">{editingProject ? 'Update the project details below.' : 'Fill in the details to list a new project for sale.'}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bg800 hover:bg-border text-text2 hover:text-text1 transition-all"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSave} className="px-6 py-6 flex flex-col gap-6">

                {/* ── Thumbnail Upload ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-4">
                  <label className={LABEL_CLS}>Project Thumbnail</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault(); setIsDragging(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) handleImageChange(file)
                    }}
                    className={`relative w-full h-40 rounded-xl cursor-pointer overflow-hidden flex items-center justify-center transition-all border-2 border-dashed ${
                      isDragging ? 'border-brand bg-brand/10' : 'border-border bg-bg900 hover:border-brand/50 hover:bg-brand/5'
                    }`}
                  >
                    {(imagePreview || formData.thumbnailUrl) ? (
                      <Image src={imagePreview || formData.thumbnailUrl!} alt="Thumbnail preview" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="text-center text-text3 pointer-events-none flex flex-col items-center">
                        <Package size={32} className="mb-2 opacity-50" />
                        <div className="text-xs font-semibold text-text2">Click or drag &amp; drop image</div>
                        <div className="text-[10px] mt-1 opacity-70">PNG, JPG, WEBP — Max 5MB</div>
                      </div>
                    )}
                    {(imagePreview || formData.thumbnailUrl) && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setFormData(f => ({ ...f, thumbnailUrl: '' })) }}
                        className="absolute top-3 right-3 bg-bg900/80 backdrop-blur border border-border rounded-lg text-text2 hover:text-text1 text-[10px] px-3 py-1.5 hover:bg-bg900 transition-all font-bold flex items-center gap-1.5"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageChange(file) }} />
                  <div className="relative pt-1">
                    <p className="text-[9px] text-text3 text-center mb-2.5 uppercase tracking-widest font-bold">— or paste image URL —</p>
                    <input
                      className={INPUT_CLS + " font-mono text-xs"}
                      placeholder="https://res.cloudinary.com/..."
                      value={formData.thumbnailUrl}
                      onChange={e => { setFormData({ ...formData, thumbnailUrl: e.target.value }); setImageFile(null); setImagePreview(e.target.value || null) }}
                    />
                  </div>
                </div>

                {/* ── Basic Info ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-[10px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Basic Info</p>

                  <div>
                    <label className={LABEL_CLS}>Project Title *</label>
                    <input required className={INPUT_CLS} placeholder="e.g., Hospital Management System" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Description *</label>
                    <textarea required className={INPUT_CLS + ' min-h-[100px] resize-y py-3'} placeholder="Describe what the project does, who it's for..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Technologies (comma-separated) *</label>
                    <input required className={INPUT_CLS} placeholder="Next.js, React, Prisma, PostgreSQL" value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })} />
                    {formData.technologies && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded bg-bg900 text-text2 border border-border uppercase tracking-wider">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Drive Links ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-[11px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Source &amp; Delivery</p>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand mb-1.5"><FolderCode size={14}/> Seller Source Link</label>
                    <p className="text-[11px] text-text3 mb-3">Submitted by seller — for your verification only</p>
                    <input className={INPUT_CLS + ' font-mono text-xs'} type="url" placeholder="https://drive.google.com/..." value={formData.sourceDriveLink} onChange={e => setFormData({ ...formData, sourceDriveLink: e.target.value })} />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning mb-1.5"><Rocket size={14}/> Admin Delivery Link</label>
                    <p className="text-[11px] text-text3 mb-3">Emailed to buyer after payment approval</p>
                    <input className={`${INPUT_CLS} font-mono text-xs focus:border-warning ${formData.adminDriveLink ? 'border-warning/30' : ''}`} type="url" placeholder="https://drive.google.com/..." value={formData.adminDriveLink} onChange={e => setFormData({ ...formData, adminDriveLink: e.target.value })} />
                  </div>
                </div>

                {/* 🤖 AI PROJECT FAIR PRICING & COMPLEXITY APPRAISAL CARD */}
                <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/30 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[22px]">🤖</span>
                      <div>
                        <h4 className="m-0 font-extrabold text-sky-400 text-[15px]">
                          AI Project Complexity & Fair Price Evaluator
                        </h4>
                        <span className="text-xs text-slate-400">
                          Student-friendly pricing bounded strictly between <strong>Rs. 1,500 (1.5k)</strong> and <strong>Rs. 9,999 (10k)</strong>.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleEvaluateProjectPrice}
                      disabled={evaluatingPrice}
                      className="px-4 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-extrabold text-[13px] border-none shadow-lg shadow-sky-500/30 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
                    >
                      {evaluatingPrice ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating...</>
                      ) : (
                        '✨ Run Fair AI Pricing'
                      )}
                    </button>
                  </div>

                  {/* Drive Deliverables Checklist removed as per requirement */}

                  {/* AI Valuation Result Card */}
                  {aiValuationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.98))',
                        borderColor: 'rgba(56, 189, 248, 0.35)',
                        boxShadow: '0 20px 40px -15px rgba(14, 165, 233, 0.25)',
                      }}
                    >
                      {/* Glowing background accent */}
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                      {/* Top Header Bar: Grade + AI Engine Badge + Apply Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10 relative z-10">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/30 px-3 py-1.5 rounded-xl">
                            <span className="text-sm">⚡</span>
                            <span className="text-xs font-bold text-sky-300">
                              Engine: {aiValuationResult.providerUsed || 'Groq / Nvidia / Gemini'}
                            </span>
                          </div>

                          <span className={`
                            px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase border shadow-md flex items-center gap-1.5
                            ${aiValuationResult.complexityGrade === 'ENTERPRISE' || aiValuationResult.complexityGrade === 'ADVANCED'
                              ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/40'
                              : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40'}
                          `}>
                            <span>🏆</span> GRADE: {aiValuationResult.complexityGrade || 'INTERMEDIATE'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, originalPrice: aiValuationResult.calculatedPriceNpr }))}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          <span>✅</span> Apply AI Price (Rs. {aiValuationResult.calculatedPriceNpr?.toLocaleString()})
                        </button>
                      </div>

                      {/* Price Breakdown Banner */}
                      <div className="my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                            Calculated Fair Selling Price
                          </span>
                          <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400">
                              Rs. {aiValuationResult.calculatedPriceNpr?.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                              Fair Range: Rs. {aiValuationResult.suggestedRange?.min?.toLocaleString()} – Rs. {aiValuationResult.suggestedRange?.max?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {aiValuationResult.scoreBreakdown && (
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 block font-semibold">Tech Stack</span>
                              <span className="font-extrabold text-cyan-300">{aiValuationResult.scoreBreakdown.techStackScore || 25}/25</span>
                            </div>
                            <div className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 block font-semibold">Features</span>
                              <span className="font-extrabold text-emerald-300">{aiValuationResult.scoreBreakdown.featuresScore || 25}/25</span>
                            </div>
                            <div className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 block font-semibold">Deliverables</span>
                              <span className="font-extrabold text-purple-300">{aiValuationResult.scoreBreakdown.deliverablesScore || 25}/25</span>
                            </div>
                            <div className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] text-slate-400 block font-semibold">Demand</span>
                              <span className="font-extrabold text-amber-300">{aiValuationResult.scoreBreakdown.marketDemandScore || 25}/25</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Calculation Breakdown & Marketability Tips */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {/* Justification List */}
                        {aiValuationResult.justificationList && aiValuationResult.justificationList.length > 0 && (
                          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-3">
                              <span>💡</span> Calculation Breakdown &amp; Rationale:
                            </span>
                            <div className="space-y-2">
                              {aiValuationResult.justificationList.map((reason: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                                  <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-sky-500/30">
                                    ✓
                                  </span>
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Marketability Tips */}
                        {aiValuationResult.marketabilityTips && aiValuationResult.marketabilityTips.length > 0 && (
                          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
                              <span>🚀</span> Value Boost Pro Tips:
                            </span>
                            <div className="space-y-2">
                              {aiValuationResult.marketabilityTips.map((tip: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                                    ★
                                  </span>
                                  <span>{tip}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ── Pricing ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-5">
                  <p className="text-[11px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Pricing</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Original Price (Rs.) *</label>
                      <input type="number" required min={0} className={INPUT_CLS} value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Final Price (Rs.)</label>
                      <input 
                        type="number" 
                        min={0} 
                        className={INPUT_CLS} 
                        value={calcDiscounted(formData.originalPrice, formData.discountPercentage)} 
                        onChange={e => {
                          const newFinal = Number(e.target.value);
                          if (formData.originalPrice > 0 && newFinal <= formData.originalPrice) {
                            const newDiscount = Math.round(((formData.originalPrice - newFinal) / formData.originalPrice) * 100);
                            setFormData({ ...formData, discountPercentage: newDiscount });
                          } else if (newFinal > formData.originalPrice) {
                            setFormData({ ...formData, originalPrice: newFinal, discountPercentage: 0 });
                          }
                        }} 
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Discount %</label>
                      <input type="number" min={0} max={100} className={INPUT_CLS} value={formData.discountPercentage} onChange={e => setFormData({ ...formData, discountPercentage: Number(e.target.value) })} />
                    </div>
                  </div>

                  {/* Live price preview */}
                  {formData.originalPrice > 0 && (
                    <div className="bg-bg900 border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 mt-3 shadow-inner">
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-text3 mb-1.5 font-bold">Final Price</div>
                        <div className="flex items-baseline gap-3">
                          {formData.discountPercentage > 0 && (
                            <span className="text-sm text-text3 line-through font-medium">Rs. {formData.originalPrice}</span>
                          )}
                          <span className="font-black text-3xl text-success drop-shadow-md">Rs. {calcDiscounted(formData.originalPrice, formData.discountPercentage)}</span>
                        </div>
                      </div>
                      {formData.discountPercentage > 0 && (
                        <div className="text-right flex flex-col items-end">
                          <div className="text-[11px] text-text3 uppercase tracking-widest mb-1 font-bold">Customer Saves</div>
                          <div className="font-bold text-xl text-rose-400 mb-1">Rs. {saved(formData.originalPrice, formData.discountPercentage)}</div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">{formData.discountPercentage}% OFF</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Features & Links ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-[10px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Features & Links</p>

                  <div>
                    <label className={LABEL_CLS}>Key Features (one per line)</label>
                    <textarea
                      className={INPUT_CLS + ' min-h-[100px] resize-y py-3'}
                      placeholder={"User authentication\nAdmin dashboard\nMobile-responsive\nFull source code + docs"}
                      value={formData.features}
                      onChange={e => setFormData({ ...formData, features: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className={LABEL_CLS}>Live Demo URL</label>
                      <input className={INPUT_CLS + ' text-xs'} type="url" placeholder="https://demo.myproject.com" value={formData.demoUrl} onChange={e => setFormData({ ...formData, demoUrl: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>YouTube Demo URL</label>
                      <input className={INPUT_CLS + ' text-xs'} type="url" placeholder="https://youtube.com/watch?v=..." value={formData.youtubeUrl} onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* ── Submit ── */}
                <div className="flex gap-3 sticky bottom-0 bg-bg900/80 backdrop-blur-xl pb-6 pt-4 -mx-6 px-6 border-t border-border mt-2 rounded-b-3xl">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn btn-primary py-4 text-sm shadow-lg shadow-brand/20"
                  >
                    {saving ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Saving…</>
                    ) : (
                      editingProject ? <><Pencil size={16}/> Save Changes</> : <><Rocket size={16}/> Publish Project</>
                    )}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-xl bg-bg800 text-text2 border border-border font-bold text-sm hover:bg-border hover:text-text1 transition-all">
                    Cancel
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewProject && (() => {
          const fp = calcDiscounted(previewProject.originalPrice, previewProject.discountPercentage)
          const screenshots = [previewProject.screenshot1, previewProject.screenshot2, previewProject.screenshot3, previewProject.screenshot4].filter(Boolean) as string[]
          let feats: string[] = []
          try { feats = JSON.parse(previewProject.features ?? '') } catch { feats = (previewProject.features ?? '').split('\n').filter(Boolean) }
          let aiData: any = null
          try { if (previewProject.aiValuationJson) aiData = JSON.parse(previewProject.aiValuationJson) } catch {}
          let credsData: Record<string, string> | null = null
          try { if (previewProject.demoCredentials) credsData = JSON.parse(previewProject.demoCredentials) } catch {}

          const statusColor = previewProject.status === 'ACTIVE' ? { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' }
            : previewProject.status === 'PENDING' ? { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-400' }
            : previewProject.status === 'CHANGES_REQUESTED' ? { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-400' }
            : { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400', dot: 'bg-slate-400' }

          return (
            <motion.div
              key="preview-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6"
              style={{ background: 'rgba(2, 6, 23, 0.92)', backdropFilter: 'blur(20px)' }}
              onClick={e => { if (e.target === e.currentTarget) setPreviewProject(null) }}
            >
              <motion.div
                key="preview-box"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full max-w-5xl bg-[#090d16] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative text-slate-200"
              >

                {/* ── TOP STICKY BAR ── */}
                <div className="sticky top-0 z-30 px-6 py-3.5 bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800/90 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                      <Eye size={17} />
                    </div>
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-white tracking-tight">Project Overview</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}>
                        {previewProject.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewProject(null)}
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0 ml-4 border border-slate-700/60"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ── SCROLLABLE CONTENT BODY ── */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">

                  {/* ── HERO BANNER & PRIMARY SUMMARY ── */}
                  <div className="relative bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 md:p-6 shadow-xl overflow-hidden">
                    {/* Background ambient glow */}
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
                      {/* Left: Thumbnail Preview Frame */}
                      <div className="md:col-span-4 flex flex-col justify-center">
                        {previewProject.thumbnailUrl ? (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl p-1 group">
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900">
                              <Image src={previewProject.thumbnailUrl} alt={previewProject.title} fill unoptimized className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <a href={previewProject.thumbnailUrl} target="_blank" rel="noreferrer" className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <Package size={32} className="text-slate-600" />
                            <span className="text-xs font-medium">No Thumbnail Provided</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Title, Badges & Author Info */}
                      <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            {previewProject.category && (
                              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                {previewProject.category}{previewProject.subcategory ? ` › ${previewProject.subcategory}` : ''}
                              </span>
                            )}
                            {previewProject.projectType && (
                              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700">
                                {previewProject.projectType}
                              </span>
                            )}
                            {previewProject.version && (
                              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700">
                                v{previewProject.version}
                              </span>
                            )}
                          </div>

                          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug capitalize">
                            {previewProject.title}
                          </h1>

                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                            Submitted by <span className="text-indigo-300 font-bold">{previewProject.user?.name ?? 'Admin'}</span>
                            {previewProject.user?.email && <span className="text-slate-500">({previewProject.user.email})</span>}
                            {previewProject.createdAt && ` • ${new Date(previewProject.createdAt).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                          </p>

                          {previewProject.shortDescription && (
                            <p className="text-sm text-slate-300 mt-3 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                              {previewProject.shortDescription}
                            </p>
                          )}
                        </div>

                        {/* Executive Stats & Price Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          <div className="bg-[#0f172a]/90 rounded-xl p-3 border border-emerald-500/30">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Selling Price</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-emerald-400">Rs. {fp}</span>
                              {previewProject.discountPercentage > 0 && (
                                <span className="text-xs text-slate-500 line-through">Rs. {previewProject.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-[#0f172a]/90 rounded-xl p-3 border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Views</span>
                            <span className="text-lg font-black text-sky-400">{previewProject.views || 0}</span>
                          </div>
                          <div className="bg-[#0f172a]/90 rounded-xl p-3 border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Sales</span>
                            <span className="text-lg font-black text-emerald-400">{previewProject._count?.orders || 0}</span>
                          </div>
                          <div className="bg-[#0f172a]/90 rounded-xl p-3 border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Organic Hits</span>
                            <span className="text-lg font-black text-purple-400">{previewProject.organicViews || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 2-COLUMN MAIN CONTENT ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN: Screenshots, Description, Objective, Features, Modules, Requirements */}
                    <div className="lg:col-span-7 space-y-5">

                      {/* Screenshots Showcase */}
                      {screenshots.length > 0 && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                            <FileText size={14} /> Screenshots Gallery ({screenshots.length})
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            {screenshots.map((s, i) => (
                              <a key={i} href={s} target="_blank" rel="noreferrer" className="relative aspect-video rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 group block shadow-md">
                                <Image src={s} alt={`Screenshot ${i+1}`} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink size={14} className="text-white" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Description */}
                      <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                          <FileText size={14} /> Full Description
                        </div>
                        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                          {previewProject.description}
                        </div>
                      </div>

                      {/* Project Objective */}
                      {previewProject.projectObjective && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                            <Layers size={14} /> Project Objective
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {previewProject.projectObjective}
                          </p>
                        </div>
                      )}

                      {/* Key Features */}
                      {feats.length > 0 && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                            <Sparkles size={14} /> Key Features
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {feats.map((f, i) => (
                              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#090d16] border border-slate-800/90 hover:border-emerald-500/30 transition-all">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-200 leading-normal">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Modules & Requirements */}
                      {(previewProject.modules || previewProject.requirements) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {previewProject.modules && (
                            <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-2 shadow-lg">
                              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                                <Layers size={13} /> Modules
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{previewProject.modules}</p>
                            </div>
                          )}
                          {previewProject.requirements && (
                            <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-2 shadow-lg">
                              <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                                <ShieldCheck size={13} /> Requirements
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{previewProject.requirements}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Limitations */}
                      {previewProject.limitations && (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-2 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                            <ShieldCheck size={14} /> Known Limitations
                          </div>
                          <p className="text-xs text-amber-200/90 leading-relaxed whitespace-pre-wrap">{previewProject.limitations}</p>
                        </div>
                      )}

                      {/* Admin Note */}
                      {previewProject.adminNote && (
                        <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-5 space-y-2 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                            <Pencil size={14} /> Admin Note
                          </div>
                          <p className="text-xs text-blue-200/90 leading-relaxed whitespace-pre-wrap">{previewProject.adminNote}</p>
                        </div>
                      )}

                    </div>

                    {/* RIGHT COLUMN: Drive Links, Tech Stack, Demo Links, Credentials, AI Report, Seller */}
                    <div className="lg:col-span-5 space-y-5">

                      {/* 1. Drive Links */}
                      <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                          <FolderCode size={14} /> Source & Delivery Links
                        </div>
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#090d16] border border-slate-800">
                            <span className="text-xs text-slate-400 font-semibold">Seller Source</span>
                            {previewProject.sourceDriveLink ? (
                              <a href={previewProject.sourceDriveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all">
                                <FolderCode size={13} /> Verify Link
                              </a>
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">Not Uploaded</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#090d16] border border-slate-800">
                            <span className="text-xs text-slate-400 font-semibold">Admin Delivery</span>
                            {previewProject.adminDriveLink ? (
                              <a href={previewProject.adminDriveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all">
                                <Rocket size={13} /> Delivery Link
                              </a>
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-500 border border-slate-700">Not Set Yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Tech Stack */}
                      <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                          <Code2 size={14} /> Tech Stack
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {previewProject.technologies.split(',').map(t => (
                            <span key={t} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wide">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                        {(previewProject.frontend || previewProject.backend || previewProject.dbType || previewProject.framework || previewProject.libraries) && (
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
                            {previewProject.frontend && <TechDetail label="Frontend" value={previewProject.frontend} />}
                            {previewProject.backend && <TechDetail label="Backend" value={previewProject.backend} />}
                            {previewProject.dbType && <TechDetail label="Database" value={previewProject.dbType} />}
                            {previewProject.framework && <TechDetail label="Framework" value={previewProject.framework} />}
                            {previewProject.libraries && <div className="col-span-2"><TechDetail label="Libraries" value={previewProject.libraries} /></div>}
                          </div>
                        )}
                      </div>

                      {/* 3. Demo & Social Links */}
                      {(previewProject.demoUrl || previewProject.youtubeUrl || previewProject.tiktokUrl || previewProject.instagramUrl || previewProject.githubUrl) && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                            <ExternalLink size={14} /> Live Demo & Social Links
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {previewProject.demoUrl && <LinkPill href={previewProject.demoUrl} label="🌐 Live Demo" color="emerald" />}
                            {previewProject.youtubeUrl && <LinkPill href={previewProject.youtubeUrl} label="▶ YouTube" color="red" />}
                            {previewProject.tiktokUrl && <LinkPill href={previewProject.tiktokUrl} label="♪ TikTok" color="pink" />}
                            {previewProject.instagramUrl && <LinkPill href={previewProject.instagramUrl} label="📷 Instagram" color="purple" />}
                            {previewProject.githubUrl && <LinkPill href={previewProject.githubUrl} label="⌥ GitHub" color="slate" />}
                          </div>
                        </div>
                      )}

                      {/* 4. Demo Credentials */}
                      {credsData && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                            <ShieldCheck size={14} /> Demo Credentials
                          </div>
                          <div className="space-y-2 font-mono text-xs pt-1">
                            {Object.entries(credsData).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between p-2.5 rounded-xl bg-[#090d16] border border-slate-800">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{k}</span>
                                <span className="text-indigo-300 font-bold select-all">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. AI Valuation Report */}
                      {aiData && (
                        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#0f172a] border border-indigo-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                              <Rocket size={14} /> AI Valuation Report
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500 text-white shadow-sm">
                              {previewProject.aiComplexityGrade}
                            </span>
                          </div>
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#090d16] border border-slate-800">
                              <span className="text-xs text-slate-400">Suggested Price Range</span>
                              <span className="text-sm font-black text-indigo-300">Rs. {aiData.suggestedRange?.min} – {aiData.suggestedRange?.max}</span>
                            </div>
                            {previewProject.aiCalculatedPrice && (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090d16] border border-slate-800">
                                <span className="text-xs text-slate-400">AI Suggested Price</span>
                                <span className="text-sm font-black text-emerald-400">Rs. {previewProject.aiCalculatedPrice}</span>
                              </div>
                            )}
                            {aiData.justificationList && aiData.justificationList.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Valuation Breakdown</span>
                                <ul className="space-y-1">
                                  {aiData.justificationList.map((j: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                      <span>{j}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 6. Seller Profile */}
                      {previewProject.user && (
                        <div className="bg-[#0f172a]/70 border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Seller Profile</span>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-base shrink-0">
                              {previewProject.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-sm truncate">{previewProject.user.name}</h4>
                              {previewProject.user.email && <p className="text-xs text-slate-400 truncate">{previewProject.user.email}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                </div>

                {/* ── STICKY FOOTER ACTIONS ── */}
                <div className="sticky bottom-0 z-30 px-6 py-4 bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                  {['PENDING', 'CHANGES_REQUESTED'].includes(previewProject.status) && (
                    <>
                      <button
                        onClick={() => { updateProjectStatusAdmin(previewProject.id, 'ACTIVE'); setPreviewProject(null) }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
                      >
                        <CheckCircle2 size={16} /> Approve & Publish
                      </button>
                      <button
                        onClick={() => { updateProjectStatusAdmin(previewProject.id, 'CHANGES_REQUESTED', true); setPreviewProject(null) }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 transition-all active:scale-[0.98]"
                      >
                        <Pencil size={16} /> Request Changes
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPreviewProject(null)}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-[0.98] shrink-0"
                  >
                    Close
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

    </div>
  )
}

// ── Helper sub-components ──
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-400">{icon}</div>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}

function InfoBlock({ label, icon, children, accent }: { label: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl overflow-hidden bg-[#0f172a]/70 border ${accent ? 'border-indigo-500/30' : 'border-slate-800'}`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 ${accent ? 'bg-indigo-500/10' : 'bg-slate-900/60'}`}>
        <span className={accent ? 'text-indigo-400' : 'text-slate-400'}>{icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${accent ? 'text-indigo-300' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="px-4 py-3 bg-[#090d16]/40">{children}</div>
    </div>
  )
}

function TechDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-[#090d16] border border-slate-800">
      <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
      <div className="text-xs font-semibold text-slate-200">{value}</div>
    </div>
  )
}

function LinkPill({ href, label, color }: { href: string; label: string; color: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    red: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
    slate: { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-300' },
  }
  const c = colors[color] || colors.slate
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all hover:opacity-80 active:scale-95 border ${c.bg} ${c.border} ${c.text}`}
    >
      {label} <ExternalLink size={11} />
    </a>
  )
}



