'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'motion/react'

export function TestimonialForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, content, rating }),
      })
      
      if (!res.ok) throw new Error('Submission failed')
      
      toast.success('Thank you! Your review has been submitted for approval.')
      setIsOpen(false)
      setName('')
      setRole('')
      setContent('')
      setRating(5)
    } catch (err) {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-outline"
        style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        ✍️ Leave a Review
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--clr-bg-900)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '440px',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOpen(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '20px' }}
              >
                &times;
              </button>
              
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Share Your Experience 💬</h2>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', marginBottom: '24px' }}>
                How has TU Notes Hub helped you in your studies?
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '6px' }}>Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} onChange={e => setName(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '6px' }}>Faculty / Role (Optional)</label>
                  <input 
                    type="text" 
                    value={role} onChange={e => setRole(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. BCA 4th Sem Student"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '6px' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '24px', cursor: 'pointer' }}>
                    {[1,2,3,4,5].map(star => (
                      <span 
                        key={star} 
                        onClick={() => setRating(star)}
                        style={{ color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.1)', transition: 'color 0.2s' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '6px' }}>Your Review</label>
                  <textarea 
                    required 
                    value={content} onChange={e => setContent(e.target.value)}
                    className="form-input" 
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="Write your feedback here..."
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
