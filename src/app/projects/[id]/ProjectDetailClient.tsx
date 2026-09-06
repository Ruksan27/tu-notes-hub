'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { getProjectSlug } from '@/lib/slugs'

interface Project {
  id: string
  title: string
  shortDescription: string | null
  description: string
  category: string | null
  subcategory: string | null
  projectType: string | null
  features: string | null
  modules: string | null
  technologies: string
  frontend: string | null
  backend: string | null
  dbType: string | null
  framework: string | null
  libraries: string | null
  originalPrice: number
  discountPercentage: number
  license: string | null
  salesType: string | null
  thumbnailUrl: string | null
  screenshot1: string | null
  screenshot2: string | null
  screenshot3: string | null
  screenshot4: string | null
  demoUrl: string | null
  youtubeUrl: string | null
  githubUrl: string | null
  status: string
  rating: number
  reviewCount: number
  user: {
    id: string
    name: string
    sellerProfile: { isVerified: boolean } | null
  } | null
  sellerId: string | null
}

// Extract YouTube video ID from any YouTube URL
function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

// Countdown timer component
function CountdownTimer({ endsAt }: { endsAt: Date }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endsAt.getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
      {[{ v: time.d, l: 'Day' }, { v: time.h, l: 'Hr' }, { v: time.m, l: 'Min' }, { v: time.s, l: 'Sec' }].map(({ v, l }, i) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: '8px', padding: '3px 7px', minWidth: '34px' }}>{pad(v)}</div>
            <div style={{ fontSize: '9px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{l}</div>
          </div>
          {i < 3 && <span style={{ color: 'var(--clr-text-3)', fontWeight: 700, marginBottom: '12px' }}>:</span>}
        </div>
      ))}
    </div>
  )
}

export default function ProjectDetailClient({ project }: { project: Project }) {
  const router = useRouter()
  const pathname = usePathname()

  const youtubeId = project.youtubeUrl ? getYoutubeId(project.youtubeUrl) : null
  const screenshots = [project.screenshot1, project.screenshot2, project.screenshot3, project.screenshot4].filter(Boolean) as string[]
  const allImages = project.thumbnailUrl ? [project.thumbnailUrl, ...screenshots] : screenshots

  const [whatsapp, setWhatsapp] = useState<string | null>(null)
  const [activeImg, setActiveImg] = useState(allImages[0] || null)
  const [showVideo, setShowVideo] = useState(!!youtubeId)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [paymentQr, setPaymentQr] = useState<string | null>(null)
  const [cartAdded, setCartAdded] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [discountEndsAt, setDiscountEndsAt] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.settings?.whatsappLink) setWhatsapp(d.settings.whatsappLink)
      if (d.settings?.paymentQrUrl) setPaymentQr(d.settings.paymentQrUrl)
    }).catch(() => {})

    // Record DB view & organic search metrics
    fetch(`/api/projects/${project.id}/view`, { method: 'POST' }).catch(() => {})

    // Check if already in cart
    fetch('/api/cart').then(r => r.json()).then(data => {
      if (data.items?.some((item: any) => item.projectItemId === project.id)) {
        setCartAdded(true)
      }
    }).catch(() => {})

    // Fetch discount end time (if any)
    const fakeEnd = new Date(Date.now() + 9 * 3600000 + 2 * 60000 + 33000)
    setDiscountEndsAt(project.discountPercentage > 0 ? fakeEnd : null)

    // Auto-show video if there's a YouTube URL
    if (project.youtubeUrl) {
      setTimeout(() => setShowVideo(true), 500)
    }
  }, [project.id, project.youtubeUrl, project.discountPercentage])

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))

  const isVerified = !!project.user?.sellerProfile?.isVerified
  const developerName = project.sellerId ? (project.user?.name || 'Seller') : 'TU Notes Hub'
  const isAdmin = !project.sellerId

  const developerHref = project.sellerId && project.user?.id
    ? `/projects/developer/${project.user.id}`
    : '/projects'

  const handleBuyNow = useCallback(async () => {
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('tu_user') : null
    let currentUser = null
    if (storedUserStr) {
      try { currentUser = JSON.parse(storedUserStr) } catch {}
    }

    if (!currentUser) {
      toast.info('Please login first to purchase this project! 🔐')
      const redirectPath = encodeURIComponent(pathname || window.location.pathname)
      router.push(`/login?redirect=${redirectPath}`)
      return
    }

    try {
      const res = await fetch('/api/auth/me')
      if (res.status === 401) {
        if (typeof window !== 'undefined') localStorage.removeItem('tu_user')
        toast.info('Please login first to purchase this project! 🔐')
        const redirectPath = encodeURIComponent(pathname || window.location.pathname)
        router.push(`/login?redirect=${redirectPath}`)
        return
      }
      const data = await res.json()
      if (data?.user?.email && !emailInput) {
        setEmailInput(data.user.email)
      }
    } catch {}

    if (currentUser?.email && !emailInput) {
      setEmailInput(currentUser.email)
    }

    setIsCheckoutOpen(true)
  }, [router, pathname, emailInput])

  const handleAddToCart = useCallback(async () => {
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('tu_user') : null
    if (!storedUserStr) {
      toast.info('Please login first to add items to cart! 🔐')
      const redirectPath = encodeURIComponent(pathname || window.location.pathname)
      router.push(`/login?redirect=${redirectPath}`)
      return
    }

    setCartLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectItemId: project.id })
      })
      if (res.status === 401) {
        if (typeof window !== 'undefined') localStorage.removeItem('tu_user')
        toast.info('Please login first to add items to cart! 🔐')
        const redirectPath = encodeURIComponent(pathname || window.location.pathname)
        router.push(`/login?redirect=${redirectPath}`)
      } else {
        setCartAdded(true)
        toast.success('Added to cart! 🛒')
      }
    } catch {
      toast.error('Failed to add to cart.')
    } finally {
      setCartLoading(false)
    }
  }, [project.id, router, pathname])

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) { toast.error('Please enter a valid email address.'); return }
    setStep(2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error('Image size must be less than 2MB.'); return }
      setScreenshotFile(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    if (!screenshotFile) { toast.error('Please upload your payment screenshot.'); return }
    if (!agreeTerms || !agreePrivacy) { toast.error('You must agree to the Terms of Service and Privacy Policy.'); return }
    setIsSubmitting(true)
    const fd = new FormData()
    fd.append('projectId', project.id)
    fd.append('email', emailInput)
    fd.append('amount', String(finalPrice))
    fd.append('screenshot', screenshotFile)
    try {
      const res = await fetch('/api/project-orders', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        toast.success('Order submitted! Check your email for confirmation.')
        setIsCheckoutOpen(false); setStep(1); setEmailInput(''); setScreenshotFile(null); setScreenshotPreview(null); setAgreeTerms(false); setAgreePrivacy(false)
      } else { toast.error(data.error || 'Failed to submit order.') }
    } catch { toast.error('Something went wrong. Please try again.') }
    finally { setIsSubmitting(false) }
  }

  // Pre-filled WhatsApp message including project title, price, and direct link
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://tunoteshub.com/projects/${getProjectSlug(project)}`
  const buyMessage = encodeURIComponent(`Hi! I am interested in inquiring about the project "${project.title}" (Rs. ${finalPrice}) listed on TU Notes Hub.\nProject Link: ${currentUrl}`)
  const buyUrl = whatsapp ? `${whatsapp}?text=${buyMessage}` : null

  const techBadges = project.technologies.split(',').map(t => t.trim()).filter(Boolean)
  const techDetails = [
    { label: 'Frontend', val: project.frontend },
    { label: 'Backend', val: project.backend },
    { label: 'Database', val: project.dbType },
    { label: 'Framework', val: project.framework },
    { label: 'Libraries', val: project.libraries },
  ].filter(x => x.val)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 28px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .project-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-top-price-banner {
            display: flex !important;
          }
          .mobile-bottom-action-bar {
            display: flex !important;
          }
          .mobile-package-includes-box {
            display: block !important;
          }
          .project-right-col {
            display: none !important;
          }
          body {
            padding-bottom: 75px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-top-price-banner {
            display: none !important;
          }
          .mobile-bottom-action-bar {
            display: none !important;
          }
          .mobile-package-includes-box {
            display: none !important;
          }
        }
      `}} />

      {/* ── SEO Breadcrumb Navigation ── */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '20px' }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--clr-text-3)' }}>
          <li><Link href="/" style={{ color: 'var(--clr-text-3)', textDecoration: 'none' }}>Home</Link></li>
          <li aria-hidden="true" style={{ opacity: 0.4 }}>/</li>
          <li><Link href="/projects" style={{ color: 'var(--clr-text-3)', textDecoration: 'none' }}>Projects</Link></li>
          <li aria-hidden="true" style={{ opacity: 0.4 }}>/</li>
          <li style={{ color: 'var(--clr-text-2)', fontWeight: 600, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} aria-current="page">{project.title}</li>
        </ol>
      </nav>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {project.category && <span style={{ fontSize: '10px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, background: 'rgba(165,180,252,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(165,180,252,0.2)' }}>{project.category}</span>}
          {project.subcategory && <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>{project.subcategory}</span>}
          {project.projectType && <span style={{ fontSize: '10px', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.2)' }}>{project.projectType}</span>}
        </div>
        <h1 style={{ fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>{project.title}</h1>
        <p style={{ fontSize: '15px', color: 'var(--clr-text-3)', margin: 0, lineHeight: 1.6 }}>{project.shortDescription}</p>
      </div>

      {/* ── Main 2-Column Layout ── */}
      <div className="project-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>

        {/* ═══════════════════════════════════════════
            LEFT COLUMN (70%) — Preview + All Content
            ═══════════════════════════════════════════ */}
        <div className="project-left-col" style={{ minWidth: 0 }}>

          {/* ── Main Image / Video Preview ── */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0d0e1a', marginBottom: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
              {activeImg ? (
                <Image src={activeImg} alt={project.title} fill unoptimized priority style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-3)', fontSize: '14px' }}>No preview available</div>
              )}
            </div>
          </div>

          {/* ── Thumbnail strip ── */}
          {allImages.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {allImages.map((src, i) => (
                <div key={i} onClick={() => { setActiveImg(src); setShowVideo(false) }} style={{ width: '80px', height: '50px', flexShrink: 0, position: 'relative', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: (!showVideo && activeImg === src) ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)', transition: 'border 0.2s' }}>
                  <Image src={src} alt={`img-${i}`} fill unoptimized style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Quick links ── */}
          {(project.demoUrl || project.youtubeUrl) && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', color: '#a5b4fc', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  🔗 Live Demo
                </a>
              )}
              {project.youtubeUrl && (
                <button onClick={() => setIsVideoModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', textDecoration: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  📺 Watch Video
                </button>
              )}
            </div>
          )}

          {/* ── MOBILE ONLY PRICE & DISCOUNT BANNER (Includes Countdown Timer) ── */}
          <div 
            className="mobile-top-price-banner" 
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              marginBottom: '24px',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Price</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>
                    Rs. {finalPrice}
                  </span>
                  {project.discountPercentage > 0 && (
                    <span style={{ fontSize: '14px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                      Rs. {project.originalPrice}
                    </span>
                  )}
                </div>
              </div>
              {project.discountPercentage > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}>
                  {project.discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* Discount Countdown Timer on Mobile */}
            {discountEndsAt && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', width: '100%' }}>
                <CountdownTimer endsAt={discountEndsAt} />
              </div>
            )}
          </div>

          {/* ── Project Overview ── */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>📄 Project Overview</h2>
            <div style={{ color: 'var(--clr-text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '14px' }}>{project.description || project.shortDescription}</div>
          </div>

          {/* ── Technology Stack ── */}
          {techBadges.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>🛠️ Technology Stack</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: techDetails.length ? '16px' : 0 }}>
                {techBadges.map(t => (
                  <span key={t} style={{ padding: '5px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: '999px', fontSize: '12px', color: '#c7d2fe', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              {techDetails.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {techDetails.map(x => (
                    <div key={x.label}>
                      <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{x.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-text-1)' }}>{x.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Core Features & Modules ── */}
          {(project.features || project.modules) && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>✨ Core Features & Modules</h2>
              <div style={{ display: 'grid', gridTemplateColumns: project.features && project.modules ? '1fr 1fr' : '1fr', gap: '20px' }}>
                {project.features && (
                  <div>
                    {project.modules && <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '10px' }}>Features</div>}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {project.features.split('\n').map((f, i) => f.trim() && (
                        <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.5 }}>
                          <span style={{ color: '#6ee7b7', flexShrink: 0, fontWeight: 700 }}>✓</span>
                          {f.replace(/^[•✓✔\-]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {project.modules && (
                  <div>
                    {project.features && <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '10px' }}>Modules</div>}
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {project.modules.split('\n').map((m, i) => m.trim() && (
                        <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.5 }}>
                          <span style={{ color: '#a5b4fc', flexShrink: 0, fontWeight: 700 }}>◆</span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MOBILE ONLY PACKAGE INCLUDES & DEVELOPER INFO BOX ── */}
          <div className="mobile-package-includes-box" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-text-1)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>📦 Package Includes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { icon: '💻', label: 'Full Source Code' },
                { icon: '🗄️', label: 'Database (.sql)' },
                { icon: '📑', label: 'Project Report / Docs' },
                { icon: '📧', label: 'Email Delivery' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--clr-text-2)' }}>
                  <span style={{ color: '#6ee7b7', fontWeight: 700 }}>✓</span>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>

            {/* Developer Details on Mobile */}
            <div style={{ padding: '14px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  {isAdmin ? '🛡️' : '👨‍💻'}
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Developer</div>
                  <Link href={developerHref} style={{ fontWeight: 700, fontSize: '14px', color: '#fff', textDecoration: 'none' }}>
                    {developerName}
                  </Link>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, background: isAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)', color: isAdmin ? '#67e8f9' : '#34d399', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${isAdmin ? 'rgba(6,182,212,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                {isAdmin ? '🛡️ Publisher' : isVerified ? '✓ Verified' : 'Seller'}
              </span>
            </div>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════
            RIGHT COLUMN (30%) — Sticky Pricing Sidebar (Desktop Only)
            ═══════════════════════════════════════════════ */}
        <div className="project-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'linear-gradient(160deg, rgba(14,12,32,0.98), rgba(8,6,20,0.98))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* Price section */}
            <div style={{ marginBottom: '4px' }}>
              {project.discountPercentage > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>Rs. {project.originalPrice}</span>
                  <span style={{ fontSize: '11px', background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', padding: '1px 8px', borderRadius: '20px', fontWeight: 700 }}>{project.discountPercentage}% OFF</span>
                </div>
              )}
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#6ee7b7', lineHeight: 1, letterSpacing: '-1px' }}>Rs. {finalPrice}</div>
            </div>

            {/* Countdown timer */}
            {discountEndsAt && (
              <div style={{ margin: '8px 0' }}>
                <CountdownTimer endsAt={discountEndsAt} />
              </div>
            )}

            {/* Checkout Action Buttons (Desktop) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'opacity 0.2s'
                }}
              >
                🛒 Buy Now
              </button>

              <button
                onClick={cartAdded ? undefined : handleAddToCart}
                disabled={cartLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: cartAdded ? 'rgba(110,231,183,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${cartAdded ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '8px',
                  color: cartAdded ? '#6ee7b7' : 'var(--clr-text-2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: cartAdded ? 'default' : 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                {cartLoading ? '⏳ Adding...' : cartAdded ? '✓ Added to Cart' : '🛍️ Add to Cart'}
              </button>

              {buyUrl && (
                <a href={buyUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', color: '#86efac', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
                  💬 Chat with Seller
                </a>
              )}
            </div>

            <p style={{ fontSize: '10.5px', color: 'var(--clr-text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.3 }}>
              Secure checkout with payment verification.
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />

            {/* Package Includes */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '10px' }}>📦 Package Includes</div>
              {[
                { icon: '💻', label: 'Full Source Code' },
                { icon: '🗄️', label: 'Database (.sql)' },
                { icon: '📑', label: 'Project Report / Docs' },
                { icon: '📧', label: 'Email Delivery' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px', fontSize: '12.5px', color: 'var(--clr-text-2)' }}>
                  <span style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '11px' }}>✓</span>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '14px 0' }} />

            {/* Developer Details */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '9px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Developer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {isAdmin ? '🛡️' : '👨‍💻'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {project.sellerId ? (
                      <Link href={`/projects/developer/${project.user?.id}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '13px', color: '#fff' }}>{developerName}</Link>
                    ) : (
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{developerName}</div>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, background: isAdmin ? 'linear-gradient(90deg, rgba(6,182,212,0.25), rgba(99,102,241,0.25))' : isVerified ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))' : 'rgba(255,255,255,0.06)', color: isAdmin ? '#67e8f9' : isVerified ? '#34d399' : 'var(--clr-text-3)', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${isAdmin ? 'rgba(6,182,212,0.3)' : isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                      {isAdmin ? '🛡️ Publisher' : isVerified ? '✓ Verified' : 'Seller'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* License details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
              {[{ l: 'License', v: project.license || 'Standard' }, { l: 'Sales Type', v: project.salesType || 'Non-Exclusive' }].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--clr-text-3)' }}>{row.l}</span>
                  <span style={{ fontWeight: 600, color: 'var(--clr-text-2)' }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsored Ad */}
          <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '8.5px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sponsored Advertisement</span>
              <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', cursor: 'default' }}>ⓘ</span>
            </div>
            <Link href="/pricing" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '6px', padding: '18px 10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--clr-text-3)' }}>300 × 250 Ad Area</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', borderRadius: '6px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#fff' }}>TU Notes Hub Premium</span>
                <span style={{ background: '#fff', color: '#6366f1', borderRadius: '4px', padding: '2px 6px', fontSize: '9.5px', fontWeight: 700 }}>Upgrade Now</span>
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* ── MOBILE ONLY FIXED BOTTOM STICKY ACTION BAR (Daraz Mobile Style) ── */}
      <div 
        className="mobile-bottom-action-bar" 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          background: 'rgba(8, 10, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(99, 102, 241, 0.25)',
          zIndex: 1000,
          padding: '8px 12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxShadow: '0 -10px 25px rgba(0,0,0,0.5)'
        }}
      >
        {/* Developer Profile Link */}
        <Link href={developerHref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-2)', textDecoration: 'none', minWidth: '54px' }}>
          <span style={{ fontSize: '18px' }}>👨‍💻</span>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Developer</span>
        </Link>

        {/* Chat Icon with Direct WhatsApp Project Link */}
        {buyUrl ? (
          <a href={buyUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-2)', textDecoration: 'none', minWidth: '44px' }}>
            <span style={{ fontSize: '18px' }}>💬</span>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Chat</span>
          </a>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-3)', minWidth: '44px' }}>
            <span style={{ fontSize: '18px' }}>💬</span>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Chat</span>
          </div>
        )}

        {/* Buy Now Button */}
        <button
          onClick={() => setIsCheckoutOpen(true)}
          style={{
            flex: 1,
            height: '44px',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          Buy Now
        </button>

        {/* Add to Cart Button */}
        <button
          onClick={cartAdded ? undefined : handleAddToCart}
          disabled={cartLoading}
          style={{
            flex: 1,
            height: '44px',
            background: cartAdded ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #ef4444, #f43f5e)',
            border: cartAdded ? '1px solid #10b981' : 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: cartAdded ? 'default' : 'pointer',
            boxShadow: cartAdded ? 'none' : '0 4px 14px rgba(239,68,68,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {cartLoading ? 'Adding...' : cartAdded ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && project.youtubeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 12, 0.88)',
              backdropFilter: 'blur(16px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setIsVideoModalOpen(false)}
          >
            <button
              onClick={() => setIsVideoModalOpen(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, transform 0.2s',
                zIndex: 2010
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              &times;
            </button>
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{
                scale: 1,
                y: 0,
                opacity: 1,
                transition: { type: 'spring', damping: 25, stiffness: 350 }
              }}
              exit={{
                scale: 0.9,
                y: 20,
                opacity: 0,
                transition: { duration: 0.15 }
              }}
              style={{
                width: '100%',
                maxWidth: '850px',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 30px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <iframe
                width="100%"
                height="100%"
                src={(() => {
                  const url = project.youtubeUrl;
                  if (url.includes('youtube.com/shorts/')) {
                    const videoId = url.split('/shorts/')[1]?.split('?')[0];
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                  }
                  if (url.includes('youtube.com/watch?v=')) {
                    const videoId = url.split('v=')[1]?.split('&')[0];
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                  }
                  if (url.includes('youtu.be/')) {
                    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                  }
                  if (url.includes('tiktok.com')) {
                    const match = url.match(/video\/(\d+)/);
                    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
                  }
                  return url;
                })()}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '480px', background: '#0b0c18', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>🛍️ Checkout — {project.title}</h3>
                <button onClick={() => { setIsCheckoutOpen(false); setStep(1); setAgreeTerms(false); setAgreePrivacy(false) }} style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              {step === 1 ? (
                <form onSubmit={handleNextStep}>
                  <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                    Please enter the email address where you want to receive the verified project files (Source code, DB dump, and documentation) after your payment is approved.
                  </p>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--clr-text-3)', marginBottom: '8px', fontWeight: 700 }}>Your Delivery Email Address *</label>
                    <input type="email" required placeholder="example@gmail.com" className="input-field" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ padding: '14px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>Proceed to Payment →</button>
                </form>
              ) : (
                <form onSubmit={handleOrderSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', textAlign: 'center', marginBottom: '16px', lineHeight: 1.6 }}>
                      Scan the QR code below to transfer <strong>Rs. {finalPrice}</strong>. Upload the transaction screenshot below.
                    </p>
                    <div style={{ width: '160px', height: '160px', position: 'relative', background: '#fff', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Image src={paymentQr || "/qr-placeholder.png"} alt="QR Code" fill style={{ objectFit: 'contain', padding: '8px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Merchant: TU Notes Hub</span>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--clr-text-3)', marginBottom: '8px', fontWeight: 700 }}>Upload Payment Screenshot *</label>
                    <div style={{ position: 'relative', border: '2px dashed rgba(99,102,241,0.25)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      <input type="file" accept="image/*" required onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📸</span>
                      <span style={{ fontSize: '13px', color: 'var(--clr-text-2)', fontWeight: 600 }}>{screenshotFile ? screenshotFile.name : 'Click to upload screenshot'}</span>
                    </div>
                    {screenshotPreview && (
                      <div style={{ marginTop: '12px', position: 'relative', width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Image src={screenshotPreview} alt="Screenshot Preview" fill style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                      <span>I Agree to the <Link href="/terms" target="_blank" className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">Terms of Service</Link></span>
                    </label>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                      <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                      <span>I Agree to the <Link href="/privacy" target="_blank" className="font-bold text-blue-400 underline underline-offset-4 decoration-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</Link></span>
                    </label>
                  </div>

                  <div style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: '10px', padding: '12px 16px', fontSize: '11px', color: 'var(--clr-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                    ⏱️ <strong>Payment Verification:</strong> Admin will verify and approve delivery within 24 hours. Files sent to <strong>{emailInput}</strong>.
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>{isSubmitting ? 'Submit Order' : 'Submit Order'}</button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
