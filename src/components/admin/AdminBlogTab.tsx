'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

type Blog = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  content: string
  excerpt: string | null
  metaTitle: string | null
  metaDesc: string | null
  keywords: string | null
  author: string
  isPublished: boolean
  fileUrl: string | null
  createdAt: string
  views: number
}

export default function AdminBlogTab() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    thumbnailUrl: '',
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDesc: '',
    keywords: '',
    author: 'TU Notes Hub',
    isPublished: true,
    fileUrl: ''
  })

  // AI Chat State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/admin/blogs')
      const data = await res.json()
      if (data.blogs) setBlogs(data.blogs)
    } catch (e) {
      toast.error('Failed to load blogs')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (blog: Blog) => {
    setEditingId(blog.id)
    setFormData({
      title: blog.title,
      slug: blog.slug,
      thumbnailUrl: blog.thumbnailUrl || '',
      content: blog.content,
      excerpt: blog.excerpt || '',
      metaTitle: blog.metaTitle || '',
      metaDesc: blog.metaDesc || '',
      keywords: blog.keywords || '',
      author: blog.author,
      isPublished: blog.isPublished,
      fileUrl: blog.fileUrl || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Blog deleted')
        fetchBlogs()
      } else {
        toast.error('Failed to delete')
      }
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(editingId ? 'Blog updated!' : 'Blog created!')
        setShowForm(false)
        setEditingId(null)
        fetchBlogs()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (e) {
      toast.error('Something went wrong')
    }
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt) return toast.error('Please enter a prompt')
    setAiGenerating(true)
    try {
      const res = await fetch('/api/admin/blogs/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      const data = await res.json()
      if (res.ok) {
        setFormData(prev => ({ ...prev, content: prev.content + '\n' + data.content }))
        toast.success('Content generated! Appended to editor.')
        setShowAiModal(false)
        setAiPrompt('')
      } else {
        toast.error(data.error || 'Failed to generate')
      }
    } catch (e) {
      toast.error('AI generation failed')
    } finally {
      setAiGenerating(false)
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingId ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug
    }))
  }

  if (loading) return <div>Loading blogs...</div>

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="admin-section-title">📝 Blog & Article Manager</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null)
            setFormData({ title: '', slug: '', thumbnailUrl: '', content: '', excerpt: '', metaTitle: '', metaDesc: '', keywords: '', author: 'TU Notes Hub', isPublished: true, fileUrl: '' })
            setShowForm(true)
          }}>
            + Create New Blog
          </button>
        )}
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--clr-bg-surface-2)', padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{editingId ? 'Edit Blog' : 'Create Blog'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAiModal(true)} style={{ borderColor: '#8b5cf6', color: '#a78bfa' }}>
                ✨ AI Assistant
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="admin-label">Title *</label>
                <input type="text" className="admin-input" required value={formData.title} onChange={handleTitleChange} />
              </div>
              <div>
                <label className="admin-label">Slug (URL) *</label>
                <input type="text" className="admin-input" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="admin-label">Thumbnail URL</label>
              <input type="text" className="admin-input" placeholder="https://res.cloudinary.com/..." value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="admin-label">Content (HTML format) *</label>
                <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Use standard HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;</span>
              </div>
              <textarea 
                className="admin-input" 
                required 
                rows={15}
                style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
                value={formData.content} 
                onChange={e => setFormData({ ...formData, content: e.target.value })} 
                placeholder="<h2>Introduction</h2><p>Write your amazing blog here...</p>"
              />
            </div>

            <div>
              <label className="admin-label">Short Excerpt (For SEO & Previews)</label>
              <textarea className="admin-input" rows={3} value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} />
            </div>

            <div style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <label className="admin-label">Attachment File URL (PDF Only)</label>
              <input type="text" className="admin-input" placeholder="https://tunoteshub.com/sample.pdf" value={formData.fileUrl} onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} />
              <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', display: 'block', marginTop: '4px' }}>If provided, a download button will appear. The PDF will be dynamically watermarked when downloaded.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="admin-label">SEO Meta Title</label>
                <input type="text" className="admin-input" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">SEO Meta Description</label>
                <input type="text" className="admin-input" value={formData.metaDesc} onChange={e => setFormData({ ...formData, metaDesc: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="admin-label">Keywords (comma separated)</label>
                <input type="text" className="admin-input" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Author Name</label>
                <input type="text" className="admin-input" required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} style={{ width: '18px', height: '18px' }} />
              <span style={{ fontWeight: 600 }}>Publish this blog</span>
            </label>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              {editingId ? 'Update Blog' : 'Publish Blog'}
            </button>
          </form>
        </motion.div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Views</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog.id}>
                  <td style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{blog.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--clr-text-3)', fontWeight: 400 }}>/{blog.slug}</span>
                    </div>
                  </td>
                  <td>{blog.author}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: blog.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: blog.isPublished ? '#10b981' : '#ef4444' }}>
                      {blog.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td>{blog.views}</td>
                  <td style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEdit(blog)}>Edit</button>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDelete(blog.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--clr-text-3)' }}>No blogs found. Start writing!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '600px', border: '1px solid #333' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#a78bfa' }}>✨ AI Blog Writer</h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '16px' }}>Tell the AI what you want to write about. It will generate SEO-friendly HTML content.</p>
            
            <textarea
              className="admin-input"
              rows={4}
              placeholder="e.g., Write a comprehensive blog post about BCA 3rd Semester DSA syllabus..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              disabled={aiGenerating}
            />
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowAiModal(false)} disabled={aiGenerating}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)' }} onClick={handleGenerateAi} disabled={aiGenerating}>
                {aiGenerating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
