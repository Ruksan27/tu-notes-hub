'use client'
// src/components/Navbar.tsx — Tailwind-powered premium navbar
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-toastify'

interface NavUser { name: string; role: string; packageType: string; email: string }

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('tu_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false) }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('tu_user')
    setUser(null)
    setDropOpen(false)
    setMenuOpen(false)
    toast.success('See you soon! 👋')
    router.push('/')
  }

  const pkgBadge: Record<string, { text: string; bg: string; color: string; border: string }> = {
    FREE:          { text: '🆓 Free',     bg: 'rgba(100,116,139,0.18)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    SEMESTER_PASS: { text: '⚡ Semester', bg: 'rgba(6,182,212,0.15)',  color: '#67e8f9', border: 'rgba(6,182,212,0.35)' },
    ELITE_AI:      { text: '🤖 Elite AI', bg: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: 'rgba(99,102,241,0.4)' },
  }
  const pkg = user ? (pkgBadge[user.packageType] ?? pkgBadge.FREE) : null

  const navLinks = [
    { href: '/faculties', label: 'Faculties' },
    { href: '/pricing',   label: 'Pricing' },
    { href: '/about',     label: 'About' },
  ]

  return (
    <>
      {/* ── Main Navbar ── */}
      <nav
        className={scrolled ? 'navbar navbar--scrolled' : 'navbar'}
        style={{ zIndex: 1000 }}
      >
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
            <div className="nav-logo-icon">📚</div>
            <span className="nav-logo-text">
              TU <span className="text-gradient">Notes Hub</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                style={pathname === link.href ? { color: 'var(--clr-text-1)', background: 'rgba(255,255,255,0.07)' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="nav-auth">
            {user ? (
              <div className="nav-user-wrap" ref={dropRef}>
                <button className="nav-user-btn" onClick={() => setDropOpen(!dropOpen)} aria-expanded={dropOpen}>
                  {/* Avatar */}
                  <div className="nav-avatar">{user.name[0].toUpperCase()}</div>
                  {/* Name */}
                  <span className="nav-username">{user.name.split(' ')[0]}</span>
                  {/* Package badge */}
                  {pkg && (
                    <span
                      className="nav-badge"
                      style={{ background: pkg.bg, color: pkg.color, border: `1px solid ${pkg.border}` }}
                    >
                      {pkg.text}
                    </span>
                  )}
                  {/* Chevron */}
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ opacity: 0.5, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="2 4 6 8 10 4" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div className="nav-dropdown">
                    <div className="nav-drop-header">
                      <p style={{ fontWeight: 600, color: 'var(--clr-text-1)', fontSize: '14px' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{user.email}</p>
                    </div>
                    <div className="nav-drop-divider" />
                    <Link href="/dashboard" className="nav-drop-item">
                      <span>📊</span> My Dashboard
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="nav-drop-item">
                        <span>⚙️</span> Admin Panel
                      </Link>
                    )}
                    <Link href="/pricing" className="nav-drop-item">
                      <span>💎</span> Upgrade Plan
                    </Link>
                    <div className="nav-drop-divider" />
                    <button className="nav-drop-item nav-drop-danger" onClick={handleLogout}>
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link href="/login"    className="btn btn-outline btn-sm">Login</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Sign Up Free</Link>
              </div>
            )}
          </div>

          {/* ── Hamburger ── */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span
              style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--clr-text-2)', borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
              }}
            />
            <span
              style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--clr-text-2)', borderRadius: '2px',
                transition: 'all 0.3s ease',
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? 'translateX(-8px)' : 'none',
              }}
            />
            <span
              style={{
                display: 'block', width: '22px', height: '2px',
                background: 'var(--clr-text-2)', borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
              }}
            />
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        <div className={`nav-mobile${menuOpen ? ' nav-mobile--open' : ''}`}>
          <div className="nav-mobile-inner">
            {/* User info in mobile menu */}
            {user && (
              <div className="nav-mobile-user">
                <div className="nav-avatar" style={{ width: '42px', height: '42px', fontSize: '18px' }}>
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px' }}>{user.name}</p>
                  {pkg && (
                    <span
                      className="nav-badge"
                      style={{ background: pkg.bg, color: pkg.color, border: `1px solid ${pkg.border}` }}
                    >
                      {pkg.text}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="nav-mobile-links">
              {/* Nav links */}
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="nav-mobile-link">
                  {link.label === 'Faculties' ? '📚' : link.label === 'Pricing' ? '💎' : 'ℹ️'} {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--clr-border)', margin: '8px 0' }} />

              {user ? (
                <>
                  <Link href="/dashboard" className="nav-mobile-link">📊 My Dashboard</Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="nav-mobile-link">⚙️ Admin Panel</Link>
                  )}
                  <button className="nav-mobile-link nav-mobile-danger" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
                  <Link href="/login"    className="btn btn-outline" style={{ justifyContent: 'center' }}>Login</Link>
                  <Link href="/register" className="btn btn-primary" style={{ justifyContent: 'center' }}>Sign Up Free</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}
    </>
  )
}
