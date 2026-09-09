'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { Package, CheckCircle2, ShoppingCart, Clock, Pencil, EyeOff, Eye, Trash2, FolderCode, Rocket, Plus } from 'lucide-react'
interface ProjectItem {
  id: string
  title: string
  description: string
  technologies: string
  originalPrice: number
  discountPercentage: number
  thumbnailUrl: string | null
  demoUrl: string | null
  youtubeUrl: string | null
  features: string | null
  status: string
  views?: number
  organicViews?: number
  searchClicks?: number
  user: { id: string; name: string } | null
  sourceDriveLink: string | null
  adminDriveLink: string | null
  aiCalculatedPrice?: number | null
  aiComplexityGrade?: string | null
  aiValuationJson?: string | null
  _count?: { orders: number }
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

const LABEL_CLS = 'block text-[10px] font-bold uppercase tracking-widest text-text3 mb-2'
const INPUT_CLS = 'input-field text-sm'

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
                          <div className="flex gap-2 mt-1">
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
                  <p className="text-[10px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Source &amp; Delivery</p>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand mb-1"><FolderCode size={12}/> Seller Source Link</label>
                    <p className="text-[10px] text-text3 mb-2.5">Submitted by seller — for your verification only</p>
                    <input className={INPUT_CLS + ' font-mono text-xs'} type="url" placeholder="https://drive.google.com/..." value={formData.sourceDriveLink} onChange={e => setFormData({ ...formData, sourceDriveLink: e.target.value })} />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-warning mb-1"><Rocket size={12}/> Admin Delivery Link</label>
                    <p className="text-[10px] text-text3 mb-2.5">Emailed to buyer after payment approval</p>
                    <input className={`${INPUT_CLS} font-mono text-xs focus:border-warning ${formData.adminDriveLink ? 'border-warning/30' : ''}`} type="url" placeholder="https://drive.google.com/..." value={formData.adminDriveLink} onChange={e => setFormData({ ...formData, adminDriveLink: e.target.value })} />
                  </div>
                </div>

                {/* ── Pricing ── */}
                <div className="bg-bg800 border border-border rounded-2xl p-5 space-y-4">
                  <p className="text-[10px] font-bold text-text2 uppercase tracking-widest border-b border-border pb-2">Pricing</p>

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
                    <div className="bg-bg900 border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4 mt-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-text3 mb-1 font-bold">Final Price</div>
                        <div className="flex items-baseline gap-2.5">
                          {formData.discountPercentage > 0 && (
                            <span className="text-xs text-text3 line-through font-medium">Rs. {formData.originalPrice}</span>
                          )}
                          <span className="font-black text-2xl text-success">Rs. {calcDiscounted(formData.originalPrice, formData.discountPercentage)}</span>
                        </div>
                      </div>
                      {formData.discountPercentage > 0 && (
                        <div className="text-right flex flex-col items-end">
                          <div className="text-[10px] text-text3 uppercase tracking-widest mb-0.5 font-bold">Customer Saves</div>
                          <div className="font-bold text-lg text-rose-400 mb-1">Rs. {saved(formData.originalPrice, formData.discountPercentage)}</div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">{formData.discountPercentage}% OFF</span>
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
    </div>
  )
}
