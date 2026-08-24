'use client'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'

interface ProjectItem {
  id: string
  title: string
  description: string
  technologies: string
  originalPrice: number
  discountPercentage: number
  status: string
  orders: any[]
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

export default function AdminProjectsTab() {
  const [activeSubTab, setActiveSubTab] = useState<'ITEMS' | 'ORDERS'>('ITEMS')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [orders, setOrders] = useState<ProjectOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', technologies: '', originalPrice: 0, discountPercentage: 0, thumbnailUrl: '', demoUrl: '', features: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [projRes, ordRes] = await Promise.all([
        fetch('/api/projects'), // Public projects API is fine for viewing
        fetch('/api/admin/projects/orders') // Needs an admin API
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

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success('Project created!')
        setIsModalOpen(false)
        fetchData()
      } else {
        toast.error('Failed to create project')
      }
    } catch {
      toast.error('Network error')
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch('/api/admin/projects/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      if (res.ok) {
        toast.success(`Order marked as ${status}`)
        fetchData()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Network error')
    }
  }

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--clr-text-2)' }}>Loading Project Management...</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-3xl font-bold mb-2">💻 Project Marketplace</h2>
          <p style={{ color: 'var(--clr-text-2)' }}>Manage your code projects and review customer inquiries/orders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add New Project</button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeSubTab === 'ITEMS' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('ITEMS')}
        >
          Manage Projects ({projects.length})
        </button>
        <button 
          className={`btn ${activeSubTab === 'ORDERS' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('ORDERS')}
        >
          Customer Orders/Inquiries ({orders.length})
        </button>
      </div>

      {activeSubTab === 'ITEMS' && (
        <div className="grid-auto">
          {projects.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: '24px' }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg">{p.title}</h3>
                <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--clr-text-2)' }}>{p.description.substring(0, 80)}...</p>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg" style={{ color: 'var(--clr-accent-h)' }}>
                  Rs. {p.originalPrice - (p.originalPrice * (p.discountPercentage / 100))}
                </span>
                {p.discountPercentage > 0 && <span className="text-xs" style={{ textDecoration: 'line-through', color: 'var(--clr-text-3)' }}>Rs. {p.originalPrice}</span>}
              </div>
              <button className="btn btn-outline btn-sm w-full" style={{ justifyContent: 'center' }}>Edit Project</button>
            </div>
          ))}
          {projects.length === 0 && <p style={{ color: 'var(--clr-text-2)' }}>No projects added yet.</p>}
        </div>
      )}

      {activeSubTab === 'ORDERS' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Project</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <p style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>{o.user.name}</p>
                    <p style={{ fontSize: '12px' }}>{o.user.email}</p>
                  </td>
                  <td><span style={{ color: 'var(--clr-primary-h)' }}>{o.projectItem.title}</span></td>
                  <td>
                    {o.transactionId ? <span className="badge badge-success">PURCHASE</span> : <span className="badge badge-warning">INQUIRY</span>}
                  </td>
                  <td>
                    {o.transactionId ? (
                      <div>
                        <p style={{ fontSize: '12px' }}>Ref: {o.transactionId}</p>
                        {o.screenshotUrl && <a href={o.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-accent)', fontSize: '12px', textDecoration: 'underline' }}>View Screenshot</a>}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', maxWidth: '200px' }}>{o.message?.substring(0,50)}...</p>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${o.status === 'APPROVED' ? 'badge-success' : o.status === 'REJECTED' ? 'badge-danger' : 'badge-pending'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => updateOrderStatus(o.id, 'APPROVED')} className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>✓ Approve</button>
                      <button onClick={() => updateOrderStatus(o.id, 'REJECTED')} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>✗ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>No orders or inquiries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Project</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--clr-text-2)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Project Title</label>
                <input required className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Description</label>
                <textarea required className="input-field" style={{ minHeight: '100px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Technologies (comma separated)</label>
                <input required className="input-field" placeholder="NextJS, React, Node" value={formData.technologies} onChange={e => setFormData({...formData, technologies: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Original Price (Rs.)</label>
                  <input type="number" required className="input-field" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Discount %</label>
                  <input type="number" required className="input-field" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Cloudinary Thumbnail URL</label>
                <input className="input-field" value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary mt-4" style={{ justifyContent: 'center' }}>Save Project</button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
