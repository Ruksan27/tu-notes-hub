'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 4000)
  }

  return (
    <footer style={{
      background: 'rgba(9, 11, 20, 0.95)',
      borderTop: '1px solid rgba(99, 102, 241, 0.15)',
      color: 'var(--clr-text-2)',
      paddingTop: '60px',
      paddingBottom: '30px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '200px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top Newsletter Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}>
                🎓
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                TU Notes <span className="text-gradient">Hub</span>
              </span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--clr-text-2)', marginBottom: '20px' }}>
              Nepal&apos;s premier academic resource hub for Tribhuvan University students. Free handwritten notes, past papers, and AI exam predictions.
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              aria-label="Facebook"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f472b6'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              aria-label="Instagram"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Quick Navigation</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <li><Link href="/faculties" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Browse Faculties</Link></li>
              <li><Link href="/pricing" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Elite Membership</Link></li>
              <li><Link href="/projects" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Student Projects</Link></li>
              <li><Link href="/blogs" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Exam Guides & Blogs</Link></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Legal & Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <li><Link href="/privacy" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Terms of Service</Link></li>
              <li><Link href="/contact" style={{ color: 'var(--clr-text-2)', textDecoration: 'none' }}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, marginBottom: '10px' }}>Exam Updates & Routines</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--clr-text-2)', marginBottom: '14px', lineHeight: 1.5 }}>
              Subscribe to get instant notifications when TU routine or exam predictions release.
            </p>
            {subscribed ? (
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700 }}>
                ✓ Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: '10px', fontWeight: 700 }}>
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingTop: '24px',
          fontSize: '12.5px',
          color: 'var(--clr-text-3)',
        }}>
          <div>
            © {new Date().getFullYear()} <strong style={{ color: 'var(--clr-text-2)' }}>TU Notes Hub</strong>. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span>Systems Normal (tunoteshub.me)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
