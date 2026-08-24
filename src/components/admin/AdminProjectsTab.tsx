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
  features: string | null
  status: string
  _count?: { orders: number }
}

interface ProjectOrder {
  id: string
  user: { name: string; email: string }
  projectItem: { title: string }
  status: string
  transactionId: string | null
  amount: number
  message: string | null
  screenshotUrl: string | null
  createdAt: string
}

interface Props {
  externalSubTab?: 'ITEMS' | 'ORDERS'
}

const EMPTY_FORM = {
  title: '',
  description: '',
  technologies: '',
  originalPrice: 0,
  discountPercentage: 0,
  thumbnailUrl: '',
  demoUrl: '',
  features: '',
}

export default function AdminProjectsTab({ externalSubTab }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'ITEMS' | 'ORDERS'>(externalSubTab ?? 'ITEMS')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [orders, setOrders] = useState<ProjectOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const screenshotRef = useRef<HTMLInputElement>(null)

  // Sync external tab selection (from sidebar dropdown)
  useEffect(() => {
    if (externalSubTab) setActiveSubTab(externalSubTab)
  }, [externalSubTab])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [projRes, ordRes] = await Promise.all([
        fetch('/api/projects'),
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
    setScreenshotPreview(null)
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
      features: (() => {
        try { return p.features ? JSON.parse(p.features).join('\n') : '' } catch { return p.features ?? '' }
      })(),
    })
    setScreenshotPreview(p.thumbnailUrl ?? null)
    setIsModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        features: formData.features
          ? JSON.stringify(formData.features.split('\n').map(s => s.trim()).filter(Boolean))
          : null,
      }
      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : '/api/admin/projects'
      const method = editingProject ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(editingProject ? 'Project updated!' : 'Project created!')
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

  // Computed price display
  const calcDiscounted = (orig: number, pct: number) =>
    pct > 0 ? Math.round(orig * (1 - pct / 100)) : orig
  const saved = (orig: number, pct: number) => Math.round(orig * pct / 100)

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 0 28px', borderBottom: '1px solid var(--clr-border)', marginBottom: '28px',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--clr-text-1)', marginBottom: '4px' }}>
            💻 Project Marketplace
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            Add, manage and sell code projects. Track orders and inquiries from customers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <span>+</span> Add New Project
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Projects', value: projects.length, icon: '📦', color: '#818cf8' },
          { label: 'Active / Visible', value: projects.filter(p => p.status === 'ACTIVE').length, icon: '🟢', color: '#6ee7b7' },
          { label: 'Total Orders', value: orders.length, icon: '🛒', color: '#67e8f9' },
          { label: 'Pending Review', value: pendingOrders, icon: '⏳', color: '#fcd34d' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sub-tab switcher ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '0' }}>
        {(['ITEMS', 'ORDERS'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            style={{
              padding: '10px 20px',
              fontSize: '14px', fontWeight: 600,
              background: 'none', border: 'none',
              borderBottom: activeSubTab === t ? '2px solid var(--clr-primary)' : '2px solid transparent',
              color: activeSubTab === t ? 'var(--clr-primary-h)' : 'var(--clr-text-2)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {t === 'ITEMS' ? '📦 Manage Projects' : '🛒 Orders & Inquiries'}
            {t === 'ORDERS' && pendingOrders > 0 && (
              <span style={{ background: '#fef08a', color: '#854d0e', borderRadius: '999px', fontSize: '11px', fontWeight: 700, padding: '2px 7px' }}>
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
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--clr-text-3)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No projects yet</p>
                <p style={{ fontSize: '13px' }}>Click "Add New Project" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map(p => {
                  const finalPrice = calcDiscounted(p.originalPrice, p.discountPercentage)
                  const savedAmt = saved(p.originalPrice, p.discountPercentage)
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: 'rgba(13,15,26,0.9)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ position: 'relative', height: '170px', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
                        {p.thumbnailUrl ? (
                          <Image src={p.thumbnailUrl} alt={p.title} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: 'rgba(255,255,255,0.05)' }}>
                            💻
                          </div>
                        )}
                        {/* Status badge overlay */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                          <span className={`badge ${p.status === 'ACTIVE' ? 'badge-strong' : 'badge-free'}`}>
                            {p.status === 'ACTIVE' ? '● LIVE' : '○ HIDDEN'}
                          </span>
                        </div>
                        {p.discountPercentage > 0 && (
                          <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                            color: '#fff', fontSize: '11px', fontWeight: 800,
                            padding: '3px 10px', borderRadius: '999px',
                          }}>
                            {p.discountPercentage}% OFF
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', color: 'var(--clr-text-1)', lineHeight: 1.3 }}>{p.title}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.5, flex: 1 }}>
                          {p.description.slice(0, 90)}{p.description.length > 90 ? '…' : ''}
                        </p>

                        {/* Tech tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {p.technologies.split(',').slice(0, 4).map(t => (
                            <span key={t} style={{
                              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                              background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                              border: '1px solid rgba(99,102,241,0.25)',
                            }}>{t.trim()}</span>
                          ))}
                        </div>

                        {/* Price block */}
                        <div style={{
                          background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                          padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              {p.discountPercentage > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textDecoration: 'line-through', marginBottom: '1px' }}>
                                  Rs. {p.originalPrice}
                                </div>
                              )}
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#6ee7b7' }}>
                                Rs. {finalPrice}
                              </div>
                            </div>
                            {p.discountPercentage > 0 && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: 'var(--clr-text-3)' }}>You save</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5' }}>Rs. {savedAmt}</div>
                                <div style={{ fontSize: '10px', color: 'var(--clr-text-3)' }}>{p.discountPercentage}% off</div>
                              </div>
                            )}
                          </div>
                          {p._count && (
                            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                              🛒 {p._count.orders} order{p._count.orders !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(p)}
                            style={{ flex: 1, justifyContent: 'center' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => toggleProjectStatus(p)}
                            style={{
                              flex: 1, justifyContent: 'center',
                              background: p.status === 'ACTIVE' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                              color: p.status === 'ACTIVE' ? '#fcd34d' : '#6ee7b7',
                              border: `1px solid ${p.status === 'ACTIVE' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                            }}
                          >
                            {p.status === 'ACTIVE' ? '🙈 Hide' : '👁 Show'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteProject(p.id)}
                            style={{ padding: '6px 10px' }}
                          >
                            🗑
                          </button>
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
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Payment / Message</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <p style={{ fontWeight: 600, color: 'var(--clr-text-1)', fontSize: '13px' }}>{o.user.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>{o.user.email}</p>
                      </td>
                      <td>
                        <span style={{ color: 'var(--clr-primary-h)', fontWeight: 600, fontSize: '13px' }}>{o.projectItem.title}</span>
                      </td>
                      <td>
                        {o.transactionId
                          ? <span className="badge badge-semester">💳 PURCHASE</span>
                          : <span className="badge badge-moderate">💬 INQUIRY</span>
                        }
                      </td>
                      <td>
                        {o.transactionId ? (
                          <div>
                            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)' }}>Ref: <code style={{ color: '#a5b4fc' }}>{o.transactionId}</code></p>
                            {o.screenshotUrl && (
                              <a href={o.screenshotUrl} target="_blank" rel="noreferrer"
                                style={{ color: 'var(--clr-accent)', fontSize: '11px', textDecoration: 'underline', display: 'block', marginTop: '2px' }}>
                                📷 View Screenshot
                              </a>
                            )}
                          </div>
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', maxWidth: '180px' }}>
                            {o.message?.slice(0, 60)}{o.message && o.message.length > 60 ? '…' : ''}
                          </p>
                        )}
                        <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '2px' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td>
                        {o.amount > 0 && (
                          <span style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '14px' }}>Rs. {o.amount}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${o.status === 'APPROVED' ? 'badge-strong' : o.status === 'REJECTED' ? 'badge-low' : 'badge-moderate'}`}>
                          {o.status === 'APPROVED' ? '✓ APPROVED' : o.status === 'REJECTED' ? '✗ REJECTED' : '⏳ PENDING'}
                        </span>
                      </td>
                      <td>
                        {o.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'APPROVED')}
                              className="btn btn-sm"
                              style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => updateOrderStatus(o.id, 'REJECTED')}
                              className="btn btn-sm"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        {o.status !== 'PENDING' && (
                          <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-text-3)' }}>
                        No orders or inquiries yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────
          ADD / EDIT PROJECT MODAL
      ────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(12px)',
              zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          >
            <motion.div
              key="modal-box"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              style={{
                width: '100%', maxWidth: '680px',
                background: '#0b0c18',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '20px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px 28px 20px',
                borderBottom: '1px solid rgba(99,102,241,0.12)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, background: '#0b0c18', zIndex: 1,
              }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--clr-text-1)' }}>
                    {editingProject ? '✏️ Edit Project' : '➕ Add New Project'}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '2px' }}>
                    {editingProject ? 'Update the project details below.' : 'Fill in the details to list a new project for sale.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--clr-text-2)', fontSize: '20px' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Thumbnail preview */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Project Thumbnail
                  </label>
                  <div style={{
                    width: '100%', height: '160px', borderRadius: '12px',
                    border: '2px dashed rgba(99,102,241,0.3)',
                    background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '10px',
                  }}>
                    {(screenshotPreview || formData.thumbnailUrl) ? (
                      <Image
                        src={screenshotPreview || formData.thumbnailUrl!}
                        alt="Thumbnail preview"
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--clr-text-3)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '6px' }}>🖼️</div>
                        <div style={{ fontSize: '12px' }}>Paste image URL below</div>
                      </div>
                    )}
                  </div>
                  <input
                    className="input-field"
                    placeholder="https://res.cloudinary.com/... or any image URL"
                    value={formData.thumbnailUrl}
                    onChange={e => { setFormData({ ...formData, thumbnailUrl: e.target.value }); setScreenshotPreview(e.target.value || null) }}
                  />
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Project Title *
                  </label>
                  <input
                    required
                    className="input-field"
                    placeholder="e.g., Hospital Management System"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Description *
                  </label>
                  <textarea
                    required
                    className="input-field"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="Describe what the project does, who it's for, what's included..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Technologies */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Technologies (comma-separated) *
                  </label>
                  <input
                    required
                    className="input-field"
                    placeholder="Next.js, React, Prisma, PostgreSQL"
                    value={formData.technologies}
                    onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                  />
                  {/* Tag preview */}
                  {formData.technologies && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                      {formData.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Original Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="input-field"
                      value={formData.originalPrice}
                      onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Discount %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input-field"
                      value={formData.discountPercentage}
                      onChange={e => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Live price calculation */}
                {formData.originalPrice > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Live Price Preview</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {formData.discountPercentage > 0 && (
                          <span style={{ fontSize: '14px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>Rs. {formData.originalPrice}</span>
                        )}
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#6ee7b7' }}>
                          Rs. {calcDiscounted(formData.originalPrice, formData.discountPercentage)}
                        </span>
                      </div>
                    </div>
                    {formData.discountPercentage > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>Customer Saves</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5' }}>
                          Rs. {saved(formData.originalPrice, formData.discountPercentage)}
                        </div>
                        <div style={{
                          display: 'inline-block', marginTop: '2px',
                          background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                          color: '#fff', fontSize: '10px', fontWeight: 800,
                          padding: '2px 8px', borderRadius: '999px',
                        }}>
                          {formData.discountPercentage}% OFF
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Key Features (one per line)
                  </label>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '90px', resize: 'vertical' }}
                    placeholder={"User authentication system\nAdmin dashboard with analytics\nMobile-responsive design\nFull source code + documentation"}
                    value={formData.features}
                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                  />
                </div>

                {/* Demo URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Live Demo URL (optional)
                  </label>
                  <input
                    className="input-field"
                    type="url"
                    placeholder="https://your-demo-site.vercel.app"
                    value={formData.demoUrl}
                    onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                  />
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {saving ? (
                      <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Saving…</>
                    ) : (
                      editingProject ? '💾 Save Changes' : '🚀 Publish Project'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsModalOpen(false)}
                  >
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
