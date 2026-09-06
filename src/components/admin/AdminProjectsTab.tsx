'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import Image from 'next/image'

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

const LABEL_CLS = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2'
const INPUT_CLS = 'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/50 transition-all'

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
    <div className="space-y-6">

      {/* ── Top Bar: Add button only ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Manage projects, track orders &amp; abandoned carts.</p>
        <button
          onClick={openAddModal}
          className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-indigo-500/25 whitespace-nowrap"
        >
          <span className="text-base leading-none">+</span> Add Project
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Projects', value: projects.length, icon: '📦', color: 'text-indigo-400', border: 'border-indigo-500/15', bg: 'from-indigo-500/8' },
          { label: 'Active / Visible', value: projects.filter(p => p.status === 'ACTIVE').length, icon: '✅', color: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'from-emerald-500/8' },
          { label: 'Total Orders', value: orders.length, icon: '🛒', color: 'text-cyan-400', border: 'border-cyan-500/15', bg: 'from-cyan-500/8' },
          { label: 'Pending Review', value: pendingOrders, icon: '⏳', color: 'text-amber-400', border: 'border-amber-500/15', bg: 'from-amber-500/8' },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden bg-gradient-to-br ${s.bg} to-transparent border ${s.border} rounded-2xl p-3.5 sm:p-4 transition-all`}>
            <div className="text-lg mb-2">{s.icon}</div>
            <div className={`font-black text-3xl sm:text-4xl ${s.color} mb-1 leading-none`}>{s.value}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-bold leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sub-tab Switcher ── */}
      <div className="grid grid-cols-3 gap-2">
        {(['ITEMS', 'ORDERS', 'CARTS'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border outline-none ${
              activeSubTab === t
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.2)]'
                : 'bg-white/[0.04] border-white/8 text-slate-400 hover:bg-white/8 hover:text-slate-200 hover:border-white/15'
            }`}
          >
            <span className="text-sm">{t === 'ITEMS' ? '📦' : t === 'ORDERS' ? '🛒' : '🛍️'}</span>
            <span className="hidden sm:inline">{t === 'ITEMS' ? 'Manage Projects' : t === 'ORDERS' ? 'Orders & Inquiries' : 'Cart Analytics'}</span>
            <span className="inline sm:hidden">{t === 'ITEMS' ? 'Projects' : t === 'ORDERS' ? 'Orders' : 'Carts'}</span>
            {t === 'ORDERS' && pendingOrders > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[8px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md">
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
                      className="flex flex-col bg-[#0f1019] border border-white/8 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-44 bg-slate-800 shrink-0">
                        {p.thumbnailUrl ? (
                          <Image src={p.thumbnailUrl} alt={p.title} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/5 to-cyan-500/5">
                            <span className="text-6xl opacity-20">💻</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1019] via-black/20 to-transparent" />

                        {/* Status pill */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                              : p.status === 'PENDING'
                              ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                              : 'bg-slate-500/25 border-slate-500/40 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : p.status === 'PENDING' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                            {p.status === 'ACTIVE' ? 'LIVE' : p.status === 'PENDING' ? 'REVIEW' : p.status}
                          </span>
                        </div>

                        {/* Discount badge */}
                        {p.discountPercentage > 0 && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-rose-500/30">
                            -{p.discountPercentage}%
                          </div>
                        )}

                        {/* Seller tag */}
                        <div className="absolute bottom-3 left-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                            p.user ? 'bg-indigo-600/70 text-white' : 'bg-cyan-600/70 text-white'
                          }`}>
                            {p.user ? `👤 ${p.user.name}` : '🛡️ Admin'}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col flex-1 p-4 gap-3.5">

                        {/* Title + Tech tags */}
                        <div>
                          <h3 className="font-extrabold text-[15px] text-white leading-snug mb-2">{p.title}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {p.technologies.split(',').slice(0, 5).map(t => (
                              <span key={t} className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wide">
                                {t.trim()}
                              </span>
                            ))}
                            {p.technologies.split(',').length > 5 && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-500 border border-white/5">
                                +{p.technologies.split(',').length - 5}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price row */}
                        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3.5 py-2.5">
                          <div>
                            {p.discountPercentage > 0 && (
                              <div className="text-[10px] text-slate-500 line-through">Rs. {p.originalPrice}</div>
                            )}
                            <div className="font-black text-2xl text-emerald-400 leading-none">Rs. {finalPrice}</div>
                          </div>
                          {p.discountPercentage > 0 && (
                            <div className="text-right">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Save</div>
                              <div className="text-sm font-black text-rose-400">Rs. {savedAmt}</div>
                            </div>
                          )}
                        </div>

                        {/* Analytics 3-col */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Views', value: views, sub: organicViews ? `${organicViews} organic` : null, color: 'text-sky-400' },
                            { label: 'Sales', value: sales, sub: null, color: 'text-emerald-400' },
                            { label: 'Conv %', value: `${conversionRate}%`, sub: null, color: 'text-indigo-400' },
                          ].map(stat => (
                            <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                              <div className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                              <div className={`text-sm font-black ${stat.color} leading-none`}>{stat.value}</div>
                              {stat.sub && <div className="text-[8px] text-slate-600 mt-0.5">{stat.sub}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        {['PENDING', 'CHANGES_REQUESTED'].includes(p.status) ? (
                          <div className="flex flex-col gap-2">
                            <button onClick={() => updateProjectStatusAdmin(p.id, 'ACTIVE')}
                              className="w-full text-xs font-extrabold py-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition-all">
                              ✓ Approve & Publish
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => updateProjectStatusAdmin(p.id, 'CHANGES_REQUESTED', true)}
                                className="flex-1 text-xs font-bold py-2.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 active:scale-95 transition-all">
                                ✍️ Request Changes
                              </button>
                              <button onClick={() => updateProjectStatusAdmin(p.id, 'REJECTED')}
                                className="text-xs font-bold py-2.5 px-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 active:scale-95 transition-all">
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal(p)}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-3 rounded-xl bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
                              ✏️ Edit
                            </button>
                            <button onClick={() => toggleProjectStatus(p)}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-3 rounded-xl border active:scale-95 transition-all ${
                                p.status === 'ACTIVE'
                                  ? 'bg-amber-500/12 text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20'
                              }`}>
                              {p.status === 'ACTIVE' ? '🙈 Hide' : '👁 Show'}
                            </button>
                            <button onClick={() => deleteProject(p.id)}
                              className="w-11 flex items-center justify-center text-sm py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all">
                              🗑
                            </button>
                          </div>
                        )}

                        {/* Drive Links */}
                        <div className="space-y-2 pt-1 border-t border-white/5">

                          {/* Seller Source */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest w-16 shrink-0">Seller</span>
                            {p.sourceDriveLink ? (
                              <a href={p.sourceDriveLink} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg hover:bg-sky-500/20 transition-all">
                                📁 Verify Source ✓
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/8 border border-rose-500/15 px-2.5 py-1 rounded-lg">
                                ⚠️ Not uploaded
                              </span>
                            )}
                          </div>

                          {/* Delivery Link */}
                          {editAdminLinkId === p.id ? (
                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-2">
                              <label className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">🚀 Admin Delivery Link</label>
                              <input
                                type="url"
                                className="w-full bg-black/40 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-400 transition-all placeholder:text-slate-600"
                                value={editAdminLink}
                                onChange={e => setEditAdminLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all" onClick={() => setEditAdminLinkId(null)}>Cancel</button>
                                <button
                                  className="flex-[2] text-[10px] font-bold py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                                  disabled={savingAdminLink}
                                  onClick={() => handleAdminSaveDeliveryLink(p.id)}
                                >
                                  {savingAdminLink ? '⏳ Saving…' : '💾 Save Link'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest w-16 shrink-0">Delivery</span>
                              {p.adminDriveLink ? (
                                <a href={p.adminDriveLink} target="_blank" rel="noreferrer"
                                  className="flex-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all truncate min-w-0">
                                  🚀 Delivery Link ✓
                                </a>
                              ) : (
                                <span className="flex-1 inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/8 border border-orange-500/15 px-2.5 py-1 rounded-lg min-w-0">
                                  ⚠️ Not set yet
                                </span>
                              )}
                              <button
                                className={`shrink-0 text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                                  p.adminDriveLink
                                    ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                    : 'bg-orange-500/15 text-orange-300 border-orange-500/25 hover:bg-orange-500/25'
                                }`}
                                onClick={() => { setEditAdminLinkId(p.id); setEditAdminLink(p.adminDriveLink || '') }}
                              >
                                {p.adminDriveLink ? '✏️' : '+ Set'}
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          >
            <motion.div
              key="modal-box"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full sm:max-w-2xl bg-[#0b0c18] border border-indigo-500/20 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0b0c18] z-10 flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-white/5">
                <div>
                  <h2 className="font-extrabold text-lg text-white">{editingProject ? '✏️ Edit Project' : '➕ Add New Project'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{editingProject ? 'Update the project details below.' : 'Fill in the details to list a new project for sale.'}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xl transition-all border border-white/5"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave} className="px-4 sm:px-6 py-5 flex flex-col gap-4">

                {/* ── Thumbnail Upload ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
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
                    className={`relative w-full h-36 rounded-xl cursor-pointer overflow-hidden flex items-center justify-center transition-all border-2 border-dashed ${
                      isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-black/20 hover:border-indigo-400/50 hover:bg-indigo-500/5'
                    }`}
                  >
                    {(imagePreview || formData.thumbnailUrl) ? (
                      <Image src={imagePreview || formData.thumbnailUrl!} alt="Thumbnail preview" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="text-center text-slate-500 pointer-events-none">
                        <div className="text-3xl mb-1.5">📸</div>
                        <div className="text-xs font-semibold">Click or drag &amp; drop</div>
                        <div className="text-[10px] mt-0.5 text-slate-600">PNG, JPG, WEBP — Max 5MB</div>
                      </div>
                    )}
                    {(imagePreview || formData.thumbnailUrl) && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setFormData(f => ({ ...f, thumbnailUrl: '' })) }}
                        className="absolute top-2 right-2 bg-black/80 border border-white/15 rounded-lg text-white text-xs px-2.5 py-1 hover:bg-black transition-all font-bold"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageChange(file) }} />
                  <div className="relative">
                    <p className="text-[10px] text-slate-600 text-center mb-2 uppercase tracking-wider font-bold">— or paste image URL —</p>
                    <input
                      className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 font-mono truncate"
                      placeholder="https://res.cloudinary.com/..."
                      value={formData.thumbnailUrl}
                      onChange={e => { setFormData({ ...formData, thumbnailUrl: e.target.value }); setImageFile(null); setImagePreview(e.target.value || null) }}
                    />
                  </div>
                </div>

                {/* ── Basic Info ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Basic Info</p>

                  <div>
                    <label className={LABEL_CLS}>Project Title *</label>
                    <input required className={INPUT_CLS} placeholder="e.g., Hospital Management System" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Description *</label>
                    <textarea required className={INPUT_CLS + ' min-h-[80px] resize-y'} placeholder="Describe what the project does, who it's for..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Technologies (comma-separated) *</label>
                    <input required className={INPUT_CLS} placeholder="Next.js, React, Prisma, PostgreSQL" value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })} />
                    {formData.technologies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <span key={t} className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wide">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Drive Links ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source &amp; Delivery</p>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1.5">📁 Seller Source Link</label>
                    <p className="text-[10px] text-slate-600 mb-2">Submitted by seller — for your verification only</p>
                    <input className={INPUT_CLS + ' font-mono text-xs'} type="url" placeholder="https://drive.google.com/..." value={formData.sourceDriveLink} onChange={e => setFormData({ ...formData, sourceDriveLink: e.target.value })} />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5">🚀 Admin Delivery Link</label>
                    <p className="text-[10px] text-slate-600 mb-2">Emailed to buyer after payment approval</p>
                    <input className={`${INPUT_CLS} font-mono text-xs ${formData.adminDriveLink ? 'border-amber-500/20' : 'border-orange-500/25'}`} type="url" placeholder="https://drive.google.com/..." value={formData.adminDriveLink} onChange={e => setFormData({ ...formData, adminDriveLink: e.target.value })} />
                  </div>
                </div>

                {/* ── Pricing ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Price (Rs.) *</label>
                      <input type="number" required min={0} className={INPUT_CLS} value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Discount %</label>
                      <input type="number" min={0} max={100} className={INPUT_CLS} value={formData.discountPercentage} onChange={e => setFormData({ ...formData, discountPercentage: Number(e.target.value) })} />
                    </div>
                  </div>

                  {/* Live price preview */}
                  {formData.originalPrice > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Final Price</div>
                        <div className="flex items-baseline gap-2">
                          {formData.discountPercentage > 0 && (
                            <span className="text-xs text-slate-500 line-through">Rs. {formData.originalPrice}</span>
                          )}
                          <span className="font-black text-xl text-emerald-400">Rs. {calcDiscounted(formData.originalPrice, formData.discountPercentage)}</span>
                        </div>
                      </div>
                      {formData.discountPercentage > 0 && (
                        <div className="text-right">
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Saves</div>
                          <div className="font-black text-base text-rose-400">Rs. {saved(formData.originalPrice, formData.discountPercentage)}</div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white">{formData.discountPercentage}% OFF</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Features & Links ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Features & Links</p>

                  <div>
                    <label className={LABEL_CLS}>Key Features (one per line)</label>
                    <textarea
                      className={INPUT_CLS + ' min-h-[80px] resize-y'}
                      placeholder={"User authentication\nAdmin dashboard\nMobile-responsive\nFull source code + docs"}
                      value={formData.features}
                      onChange={e => setFormData({ ...formData, features: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex gap-3 sticky bottom-0 bg-[#0b0c18] pb-4 pt-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-white/5 mt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-extrabold py-3.5 rounded-xl text-sm hover:opacity-90 active:translate-y-0.5 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                  >
                    {saving ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
                    ) : (
                      editingProject ? '💾 Save Changes' : '🚀 Publish Project'
                    )}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 font-bold text-sm hover:bg-white/10 hover:text-slate-200 transition-all">
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
