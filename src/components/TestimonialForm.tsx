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
  const [hoveredRating, setHoveredRating] = useState(0)
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
      
      toast.success('Thank you! Your review has been received. It may take some time to appear on the site.')
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
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: 'linear-gradient(145deg, rgba(20,20,30,0.95), rgba(10,10,15,0.98))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '480px',
                position: 'relative', overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />

              <button 
                onClick={() => setIsOpen(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--clr-text-2)', cursor: 'pointer', fontSize: '20px', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                &times;
              </button>
              
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Share Your Experience
              </h2>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '32px' }}>
                How has TU Notes Hub helped you in your studies?
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Faculty / Role (Optional)</label>
                  <input 
                    type="text" 
                    value={role} onChange={e => setRole(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', transition: 'all 0.2s', outline: 'none' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    placeholder="e.g. BCA 4th Sem Student"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '12px' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '12px', cursor: 'pointer' }} onMouseLeave={() => setHoveredRating(0)}>
                    {[1,2,3,4,5].map(star => (
                      <motion.div
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        initial={{ opacity: 0, rotate: -45 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ delay: star * 0.05, type: 'spring', stiffness: 300 }}
                        style={{ 
                          fontSize: '32px',
                          color: star <= (hoveredRating || rating) ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                          filter: star <= (hoveredRating || rating) ? 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' : 'none',
                          transition: 'color 0.2s, filter 0.2s'
                        }}
                      >
                        ★
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>Your Review</label>
                  <textarea 
                    required 
                    value={content} onChange={e => setContent(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', transition: 'all 0.2s', outline: 'none', minHeight: '120px', resize: 'vertical' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--clr-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    placeholder="Write your feedback here..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    marginTop: '12px', 
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: '16px', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 20px -10px rgba(99,102,241,0.5)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px -10px rgba(99,102,241,0.6)' }}
                  onMouseOut={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(99,102,241,0.5)' }}
                >
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
