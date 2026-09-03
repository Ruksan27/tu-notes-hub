'use client'
// src/components/AiAnswerModal.tsx
// Beautiful AI Answer Modal with Chat functionality
// - Shows initial AI answer for an exam question
// - Gemini-style UI

import React, { useState, useEffect, useRef } from 'react'
import { motion, useDragControls } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import CustomLoader from './CustomLoader'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

interface AiAnswerModalProps {
  isOpen: boolean
  onClose: () => void
  questionText: string
}

export default function AiAnswerModal({ isOpen, onClose, questionText }: AiAnswerModalProps) {
  const [initialAnswer, setInitialAnswer] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')
  const [isPaidUser, setIsPaidUser] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const dragControls = useDragControls()
  const [panelSize, setPanelSize] = useState({ width: 750, height: 500 })

  const handleResizeDrag = (e: React.MouseEvent, edges: string[]) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = panelSize.width
    const startHeight = panelSize.height

    const onMouseMove = (ev: MouseEvent) => {
      let newW = startWidth
      let newH = startHeight
      if (edges.includes('right')) newW = startWidth + (ev.clientX - startX)
      if (edges.includes('left')) newW = startWidth - (ev.clientX - startX)
      if (edges.includes('bottom')) newH = startHeight + (ev.clientY - startY)
      if (edges.includes('top')) newH = startHeight - (ev.clientY - startY)
      setPanelSize({
        width: Math.max(320, Math.min(newW, window.innerWidth - 40)),
        height: Math.max(400, Math.min(newH, window.innerHeight - 40))
      })
    }
    const onMouseUp = () => {
      document.body.style.cursor = 'default'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.body.style.cursor = edges.includes('left') || edges.includes('right') ? 'ew-resize' : 'ns-resize'
    if (edges.length > 1) document.body.style.cursor = edges.includes('left') === edges.includes('top') ? 'nwse-resize' : 'nesw-resize'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Check subscription status
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          setIsPaidUser(true)
        }
      }
    } catch {}
  }, [])

  // Fetch initial answer when modal opens
  useEffect(() => {
    if (!isOpen || !questionText) return

    setInitialAnswer('')
    setChatHistory([])
    setChatInput('')
    setError('')
    setFromCache(false)
    setLoading(true)

    fetch('/api/ai/solve-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionText, chatHistory: [] }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setInitialAnswer(data.answer)
          setFromCache(data.fromCache)
        }
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [isOpen, questionText])

  // Auto-scroll inside chat container ONLY (does not scroll main page/window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatHistory, loading])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sendChatMessage = async () => {
    if (!chatInput.trim() || loading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setLoading(true)

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', text: userMessage },
    ]
    setChatHistory(newHistory)

    try {
      const res = await fetch('/api/ai/solve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, chatHistory: newHistory }),
      })
      const data = await res.json()

      if (data.error) {
        setChatHistory(prev => [...prev, { role: 'model', text: `❌ ${data.error}` }])
      } else {
        setChatHistory(prev => [...prev, { role: 'model', text: data.answer }])
      }
    } catch {
      setChatHistory(prev => [...prev, { role: 'model', text: '❌ Network error. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal - now a draggable floating widget */}
      <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{
          position: 'fixed',
          bottom: '30px', right: '30px',
          zIndex: 9999,
          width: `${panelSize.width}px`,
          height: `${panelSize.height}px`,
          background: '#0f1117',
          borderRadius: '16px',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Custom Resize Handles ── */}
        <div onMouseDown={(e) => handleResizeDrag(e, ['left'])} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize', zIndex: 50 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['right'])} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize', zIndex: 50 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['top'])} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', cursor: 'ns-resize', zIndex: 50 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['bottom'])} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', cursor: 'ns-resize', zIndex: 50 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['top', 'left'])} style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', cursor: 'nwse-resize', zIndex: 51 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['top', 'right'])} style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', cursor: 'nesw-resize', zIndex: 51 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['bottom', 'left'])} style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '12px', cursor: 'nesw-resize', zIndex: 51 }} />
        <div onMouseDown={(e) => handleResizeDrag(e, ['bottom', 'right'])} style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', cursor: 'nwse-resize', zIndex: 51 }} />
        {/* Header */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
            cursor: 'grab',
          }}
        >
          {/* TU AI Logo */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}>
            <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)', pointerEvents: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
              Scholar AI
            </div>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.45)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {questionText.length > 80 ? questionText.slice(0, 80) + '…' : questionText}
            </div>
          </div>
          {fromCache && (
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'rgba(251,191,36,0.15)', color: '#FBBF24',
              border: '1px solid rgba(251,191,36,0.3)',
              fontSize: '14px',
            }} title="Loaded from Cache">
              ⚡
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '18px',
              lineHeight: 1, padding: '4px', borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div ref={chatContainerRef} style={{
          flex: 1, overflowY: 'auto', padding: '20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.3) transparent',
        }}>
          {/* Original Question Bubble */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(66,133,244,0.15)', border: '1px solid rgba(66,133,244,0.2)',
              borderRadius: '12px 12px 2px 12px', padding: '12px 16px',
              maxWidth: '85%', fontSize: '13px', color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
            }}>
              {questionText}
            </div>
          </div>

          {/* Initial Answer */}
          {loading && !initialAnswer && chatHistory.length === 0 ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', marginTop: '2px',
              }}>
                <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)', pointerEvents: 'none' }} />
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '2px 12px 12px 12px', padding: '8px',
                display: 'flex', gap: '8px', alignItems: 'center',
              }}>
                <CustomLoader />
              </div>
            </div>
          ) : initialAnswer ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', marginTop: '2px',
              }}>
                <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)', pointerEvents: 'none' }} />
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '2px 12px 12px 12px', padding: '16px 18px',
                flex: 1, minWidth: 0,
              }}>
                <div className="ai-answer-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {initialAnswer}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : error ? (
            <div style={{
              background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)',
              borderRadius: '8px', padding: '12px 16px', color: '#EA4335', fontSize: '13px',
            }}>
              ❌ {error}
            </div>
          ) : null}

          {/* Chat History */}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '10px', alignItems: 'flex-start',
              marginBottom: '14px',
            }}>
              {msg.role === 'model' && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', marginTop: '2px',
                }}>
                  <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)', pointerEvents: 'none' }} />
                </div>
              )}
              <div style={{
                maxWidth: '85%',
                background: msg.role === 'user'
                  ? 'rgba(66,133,244,0.15)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user'
                  ? '1px solid rgba(66,133,244,0.2)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: msg.role === 'user'
                  ? '12px 12px 2px 12px'
                  : '2px 12px 12px 12px',
                padding: '12px 16px',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.85)',
              }}>
                {msg.role === 'model' ? (
                  <div className="ai-answer-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : msg.text}
              </div>
            </div>
          ))}

          {/* Loading indicator for follow-up */}
          {loading && chatHistory.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}>
                <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)', pointerEvents: 'none' }} />
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '2px 12px 12px 12px', padding: '0px 8px',
                display: 'flex', gap: '8px', alignItems: 'center',
                transform: 'scale(0.8)', transformOrigin: 'left center'
              }}>
                <CustomLoader />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
        }}>
          {isPaidUser ? (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', padding: '8px 8px 8px 16px',
              transition: 'border-color 0.2s',
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask a follow-up question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '13px',
                } as any}
              />
              <button
                onClick={sendChatMessage}
                disabled={loading || !chatInput.trim()}
                style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: loading || !chatInput.trim()
                    ? 'rgba(255,255,255,0.08)'
                    : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  border: 'none', cursor: loading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', transition: 'all 0.2s',
                  color: '#fff', flexShrink: 0,
                }}
              >
                {loading ? '⏳' : '➤'}
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(236, 72, 153, 0.05)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              borderRadius: '24px', padding: '8px 16px',
            }}>
              <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
                Follow-up chat is available for Elite users.
              </span>
              <a href="/pricing" style={{
                fontSize: '12px', fontWeight: 600, color: '#ec4899',
                textDecoration: 'none', borderBottom: '1px solid #ec4899'
              }}>
                Upgrade to Elite
              </a>
            </div>
          )}
          <div style={{
            textAlign: 'center', marginTop: '8px',
            fontSize: '10px', color: 'rgba(255,255,255,0.2)',
          }}>
            Powered by Scholar AI
          </div>
        </div>
      </motion.div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.3 } 40% { transform: scale(1); opacity: 1 } }

        .ai-thinking-dots { display: flex; gap: 4px; align-items: center; }
        .ai-thinking-dots span {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(66,133,244,0.7);
          animation: dotBounce 1.4s infinite;
        }
        .ai-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ai-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

        .ai-answer-content { color: rgba(255,255,255,0.85); font-size: 13.5px; line-height: 1.75; }
        .ai-answer-content h1, .ai-answer-content h2, .ai-answer-content h3 { color: #fff; margin: 16px 0 8px; font-size: 15px; }
        .ai-answer-content strong { color: #fff; font-weight: 700; }
        .ai-answer-content code { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 12.5px; color: #a5b4fc; }
        .ai-answer-content pre { background: #0a0d14; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 12px 0; }
        .ai-answer-content pre code { background: none; padding: 0; color: #e2e8f0; }
        .ai-answer-content ul, .ai-answer-content ol { padding-left: 20px; margin: 8px 0; }
        .ai-answer-content li { margin-bottom: 4px; }
        .ai-answer-content p { margin: 6px 0; }
        .ai-answer-content blockquote { border-left: 3px solid rgba(66,133,244,0.5); padding-left: 12px; color: rgba(255,255,255,0.6); margin: 8px 0; }
      `}</style>
    </>
  )
}
