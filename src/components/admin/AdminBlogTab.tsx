'use client'

import { useState, useEffect, useRef } from 'react'
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

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  modelUsed?: string
}

export default function AdminBlogTab() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'draft'>('all')

  // Side-by-side AI Assistant Panel State
  const [showAiPanel, setShowAiPanel] = useState(true)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [aiInputText, setAiInputText] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  
  // Interactive Chat Thread
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Namaste! I am your AI Blog Writing Copilot. Select a model (Gemini, OpenAI, or NVIDIA) and tell me what you want to write or refine!'
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Form State - Default isPublished: false (Draft)
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
    isPublished: false,
    fileUrl: ''
  })

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      slug: '',
      thumbnailUrl: '',
      content: '',
      excerpt: '',
      metaTitle: '',
      metaDesc: '',
      keywords: '',
      author: 'TU Notes Hub',
      isPublished: false,
      fileUrl: ''
    })
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Ready to write! Choose an AI model and start chatting.'
      }
    ])
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

  const handleQuickStatusToggle = async (blog: Blog) => {
    try {
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blog, isPublished: !blog.isPublished })
      })
      if (res.ok) {
        toast.success(blog.isPublished ? 'Changed to Draft' : 'Published live!')
        fetchBlogs()
      } else {
        toast.error('Status change failed')
      }
    } catch (e) {
      toast.error('Network error')
    }
  }

  const handleSubmit = async (e: React.FormEvent, publishOverride?: boolean) => {
    e.preventDefault()

    const payload = {
      ...formData,
      isPublished: publishOverride !== undefined ? publishOverride : formData.isPublished
    }

    try {
      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(
          payload.isPublished
            ? (editingId ? 'Blog updated & Published!' : 'Blog Published successfully!')
            : (editingId ? 'Blog updated as Draft!' : 'Blog saved as Draft!')
        )
        setShowForm(false)
        resetForm()
        fetchBlogs()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch (e) {
      toast.error('Something went wrong')
    }
  }

  // Interactive AI Chat Runner
  const handleSendChatMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || aiInputText
    if (!textToSend.trim() || aiGenerating) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend
    }

    const updatedHistory = [...chatMessages, userMessage]
    setChatMessages(updatedHistory)
    if (!presetPrompt) setAiInputText('')
    setAiGenerating(true)

    // Prepare API format messages
    const apiMessages = updatedHistory
      .filter(m => m.id !== 'welcome-1')
      .map(m => ({ role: m.role, content: m.text }))

    try {
      const res = await fetch('/api/admin/blogs/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel
        })
      })

      const data = await res.json()
      if (res.ok && data.content) {
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.content,
          modelUsed: data.modelUsed || selectedModel
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        toast.error(data.error || 'AI generation failed')
      }
    } catch (e) {
      toast.error('AI chat error')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAppendContent = (text: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? prev.content + '\n\n' + text : text
    }))
    toast.success('Appended content to editor!')
  }

  const handleReplaceContent = (text: string) => {
    setFormData(prev => ({
      ...prev,
      content: text
    }))
    toast.success('Replaced editor content!')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingId ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug
    }))
  }

  const filteredBlogs = blogs.filter(b => {
    if (filterTab === 'published') return b.isPublished
    if (filterTab === 'draft') return !b.isPublished
    return true
  })

  if (loading) return <div style={{ color: 'var(--clr-text-3)', padding: '20px' }}>Loading blogs...</div>

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="admin-section-title" style={{ margin: 0 }}>📝 Blog & Article Manager</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--clr-text-3)' }}>Create & draft blogs with Gemini, OpenAI, and NVIDIA AI Chat Copilot.</p>
        </div>

        {!showForm && (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontWeight: 700, padding: '10px 20px' }}
          >
            + Create New Blog
          </button>
        )}
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--clr-text-1)', margin: 0 }}>
                {editingId ? '✏️ Edit Blog Post' : '✨ Create New Blog Post'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                Status: {formData.isPublished ? <strong style={{ color: '#10b981' }}>🟢 Published</strong> : <strong style={{ color: '#f59e0b' }}>📝 Draft</strong>}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowAiPanel(!showAiPanel)} 
                style={{ 
                  borderColor: showAiPanel ? '#a78bfa' : 'rgba(255,255,255,0.15)', 
                  color: showAiPanel ? '#c084fc' : 'var(--clr-text-2)', 
                  background: showAiPanel ? 'rgba(139, 92, 246, 0.15)' : 'transparent', 
                  fontWeight: 600 
                }}
              >
                {showAiPanel ? '💬 Hide AI Chat' : '💬 Open AI Chat Copilot'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{ color: 'var(--clr-text-3)' }}
              >
                Cancel
              </button>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Section 1: Basic Details */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818cf8', marginBottom: '14px' }}>
                1. Basic Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="admin-label">Blog Title *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    required 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g., Ultimate Guide to BCA 3rd Sem Data Structures"
                    value={formData.title} 
                    onChange={handleTitleChange} 
                  />
                </div>
                <div>
                  <label className="admin-label">Slug / URL Path *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    required 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g., bca-3rd-sem-dsa-guide"
                    value={formData.slug} 
                    onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="admin-label">Author Name</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    required 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={formData.author} 
                    onChange={e => setFormData({ ...formData, author: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: SIDE-BY-SIDE EDITOR & MULTI-MODEL AI CHAT COPILOT */}
            <div style={{ display: 'grid', gridTemplateColumns: showAiPanel ? '1fr 420px' : '1fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Left Side: Article Content Editor */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38bdf8', margin: 0 }}>
                    2. Article Content (HTML)
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Supports &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;code&gt;</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="admin-label">Cover Image URL</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://images.unsplash.com/..." 
                      value={formData.thumbnailUrl} 
                      onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="admin-label">Attached PDF Notes URL</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="https://drive.google.com/..." 
                      value={formData.fileUrl} 
                      onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} 
                    />
                  </div>
                </div>

                <textarea 
                  className="admin-input" 
                  required 
                  rows={20}
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    fontFamily: 'var(--font-mono, monospace)', 
                    fontSize: '13px', 
                    lineHeight: 1.6, 
                    background: '#090d16',
                    padding: '14px',
                    borderRadius: '8px'
                  }}
                  value={formData.content} 
                  onChange={e => setFormData({ ...formData, content: e.target.value })} 
                  placeholder="<h2>Introduction</h2><p>Write your detailed blog content here...</p>"
                />
              </div>

              {/* Right Side: Interactive AI Chat Copilot with Model Selection */}
              {showAiPanel && (
                <div 
                  style={{ 
                    background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.08), rgba(15, 23, 42, 0.95))', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '12px', 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '620px',
                    position: 'sticky',
                    top: '20px'
                  }}
                >
                  {/* Model Selector Top Bar */}
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🤖</span>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#c084fc', margin: 0 }}>AI Model Chat</h4>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setChatMessages([{ id: 'w-1', role: 'assistant', text: 'Chat history cleared. How can I help you write?' }])}
                        style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-3)', fontSize: '11px', cursor: 'pointer' }}
                        title="Clear Chat History"
                      >
                        🗑️ Clear Chat
                      </button>
                    </div>

                    {/* Model Dropdown Selector */}
                    <div>
                      <select 
                        value={selectedModel} 
                        onChange={e => setSelectedModel(e.target.value)}
                        style={{ 
                          width: '100%', 
                          boxSizing: 'border-box',
                          background: '#090d16', 
                          border: '1px solid rgba(139, 92, 246, 0.4)', 
                          color: '#e2e8f0', 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <optgroup label="🔮 Google Gemini Models">
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Smart)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Context)</option>
                        </optgroup>

                        <optgroup label="⚡ OpenAI Models">
                          <option value="gpt-4o-mini">GPT-4o Mini (Ultra Fast OpenAI)</option>
                          <option value="gpt-4o">GPT-4o (Premium OpenAI)</option>
                        </optgroup>

                        <optgroup label="🧠 NVIDIA Nim & Open Models">
                          <option value="meta/llama-3.3-70b-instruct">NVIDIA Llama 3.3 70B</option>
                          <option value="nvidia/llama-3.1-nemotron-70b-instruct">NVIDIA Nemotron 70B</option>
                          <option value="deepseek-ai/deepseek-r1">NVIDIA DeepSeek R1 (Reasoning)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Preset Shortcut Chips */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const title = formData.title || 'TU BCA Exam Guide'
                        handleSendChatMessage(`Write a full article in HTML format about "${title}". Include H2 headings, paragraphs, and list items.`)
                      }}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🚀 Full Article
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const title = formData.title || 'TU Notes'
                        handleSendChatMessage(`Generate 5 key exam tips and summary points in HTML format for "${title}".`)
                      }}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      💡 Exam Tips
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSendChatMessage('Generate SEO meta title, description, and keywords for this blog post.')
                      }}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#34d399', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🏷️ SEO Meta
                    </button>
                  </div>

                  {/* Scrollable Conversation Thread */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                    {chatMessages.map(msg => (
                      <div 
                        key={msg.id} 
                        style={{ 
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '90%',
                          background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(15, 23, 42, 0.95)',
                          border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          padding: '12px',
                          fontSize: '12px',
                          lineHeight: 1.5
                        }}
                      >
                        {msg.role === 'assistant' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 700 }}>
                              {msg.modelUsed ? `🤖 ${msg.modelUsed}` : '🤖 AI Copilot'}
                            </span>
                          </div>
                        )}

                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: msg.role === 'assistant' ? 'monospace' : 'inherit', fontSize: msg.role === 'assistant' ? '11px' : '12px' }}>
                          {msg.text}
                        </div>

                        {/* Action buttons inside AI reply */}
                        {msg.role === 'assistant' && msg.text.includes('<') && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                              type="button"
                              onClick={() => handleAppendContent(msg.text)}
                              style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                            >
                              ➕ Insert to Blog
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReplaceContent(msg.text)}
                              style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #c084fc', background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', cursor: 'pointer', fontWeight: 600 }}
                            >
                              🔄 Replace All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text)
                                toast.success('HTML copied!')
                              }}
                              style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--clr-text-3)', cursor: 'pointer' }}
                            >
                              📋 Copy
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {aiGenerating && (
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #c084fc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                        Generating with {selectedModel}...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Field & Send Button */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="admin-input"
                      style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '8px 12px', background: '#090d16' }}
                      placeholder="Ask AI to write, rewrite, or expand..."
                      value={aiInputText}
                      onChange={e => setAiInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendChatMessage()
                        }
                      }}
                      disabled={aiGenerating}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSendChatMessage()}
                      disabled={aiGenerating}
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '8px 16px', fontSize: '13px', fontWeight: 700 }}
                    >
                      Send
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Section 3: SEO Metadata & Excerpt */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#34d399', marginBottom: '14px' }}>
                3. SEO & Card Excerpt
              </h4>

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Short Excerpt (Shows on Blog listing card)</label>
                <textarea 
                  className="admin-input" 
                  rows={2} 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="Brief summary of the article..."
                  value={formData.excerpt} 
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="admin-label">SEO Meta Title (60 chars max)</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="Custom Google Search title..."
                    value={formData.metaTitle} 
                    onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="admin-label">SEO Meta Description (160 chars max)</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="Meta description for search engines..."
                    value={formData.metaDesc} 
                    onChange={e => setFormData({ ...formData, metaDesc: e.target.value })} 
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Keywords (Comma separated)</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="bca, tu notes, data structures, exam syllabus"
                    value={formData.keywords} 
                    onChange={e => setFormData({ ...formData, keywords: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Status Selection & Action Bar */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="admin-label" style={{ marginBottom: '6px', display: 'block' }}>Publication Visibility</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPublished: false })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: formData.isPublished ? '1px solid rgba(255,255,255,0.1)' : '2px solid #f59e0b',
                      background: formData.isPublished ? 'transparent' : 'rgba(245, 158, 11, 0.15)',
                      color: formData.isPublished ? 'var(--clr-text-3)' : '#fbbf24',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📝 Draft (Hidden from public)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPublished: true })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: !formData.isPublished ? '1px solid rgba(255,255,255,0.1)' : '2px solid #10b981',
                      background: !formData.isPublished ? 'transparent' : 'rgba(16, 185, 129, 0.15)',
                      color: !formData.isPublished ? 'var(--clr-text-3)' : '#34d399',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🟢 Publicly Published
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={(e) => handleSubmit(e, false)}
                  style={{ borderColor: '#f59e0b', color: '#fbbf24', fontWeight: 700 }}
                >
                  💾 Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, true)}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontWeight: 700, padding: '10px 24px' }}
                >
                  🚀 Publish Live
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      ) : (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            {(['all', 'published', 'draft'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: filterTab === tab ? '#818cf8' : 'var(--clr-text-3)',
                  fontWeight: filterTab === tab ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'all' ? `All (${blogs.length})` : tab === 'published' ? `Published (${blogs.filter(b => b.isPublished).length})` : `Drafts (${blogs.filter(b => !b.isPublished).length})`}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title & Slug</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Attached Notes</th>
                  <th>Views</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map(blog => (
                  <tr key={blog.id}>
                    <td style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px' }}>{blog.title}</span>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 400 }}>/blogs/{blog.slug}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{blog.author}</td>
                    <td>
                      <button
                        onClick={() => handleQuickStatusToggle(blog)}
                        title="Click to toggle status"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          background: blog.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: blog.isPublished ? '#34d399' : '#fbbf24'
                        }}
                      >
                        {blog.isPublished ? '🟢 PUBLISHED' : '📝 DRAFT'}
                      </button>
                    </td>
                    <td>
                      {blog.fileUrl ? (
                        <span style={{ fontSize: '11px', color: '#38bdf8', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}>
                          📄 PDF Attached
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px' }}>👁️ {blog.views}</td>
                    <td style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>{new Date(blog.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEdit(blog)}>Edit</button>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDelete(blog.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBlogs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--clr-text-3)' }}>
                      No blogs found in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
