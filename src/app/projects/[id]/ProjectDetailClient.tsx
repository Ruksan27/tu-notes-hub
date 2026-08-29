'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'

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
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
      {[{ v: time.d, l: 'Day' }, { v: time.h, l: 'Hr' }, { v: time.m, l: 'Min' }, { v: time.s, l: 'Sec' }].map(({ v, l }, i) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: '8px', padding: '4px 8px', minWidth: '36px' }}>{pad(v)}</div>
            <div style={{ fontSize: '9px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{l}</div>
          </div>
          {i < 3 && <span style={{ color: 'var(--clr-text-3)', fontWeight: 700, marginBottom: '14px' }}>:</span>}
        </div>
      ))}
    </div>
  )
}

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [whatsapp, setWhatsapp] = useState<string | null>(null)
  const [activeImg, setActiveImg] = useState<string | null>(project.thumbnailUrl)
  const [showVideo, setShowVideo] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentQr, setPaymentQr] = useState<string | null>(null)
  const [cartAdded, setCartAdded] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [discountEndsAt, setDiscountEndsAt] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.settings?.whatsappLink) setWhatsapp(d.settings.whatsappLink)
      if (d.settings?.paymentQrUrl) setPaymentQr(d.settings.paymentQrUrl)
    }).catch(() => {})

    // Check if already in cart
    fetch('/api/cart').then(r => r.json()).then(data => {
      if (data.items?.some((item: any) => item.projectItemId === project.id)) {
        setCartAdded(true)
      }
    }).catch(() => {})

    // Fetch discount end time (if any) from pricing API for display purposes
    // Use a fallback static discount period as an example
    const fakeEnd = new Date(Date.now() + 9 * 3600000 + 2 * 60000 + 33000)
    setDiscountEndsAt(project.discountPercentage > 0 ? fakeEnd : null)

    // Auto-show video if there's a YouTube URL
    if (project.youtubeUrl) {
      setTimeout(() => setShowVideo(true), 500)
    }
  }, [project.id, project.youtubeUrl, project.discountPercentage])

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))
  const screenshots = [project.screenshot1, project.screenshot2, project.screenshot3, project.screenshot4].filter(Boolean) as string[]
  const allImages = project.thumbnailUrl ? [project.thumbnailUrl, ...screenshots] : screenshots

  const isVerified = !!project.user?.sellerProfile?.isVerified
  const developerName = project.sellerId ? (project.user?.name || 'Seller') : 'TU Notes Hub'
  const isAdmin = !project.sellerId

  const youtubeId = project.youtubeUrl ? getYoutubeId(project.youtubeUrl) : null

  const handleAddToCart = useCallback(async () => {
    setCartLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectItemId: project.id })
      })
      if (res.status === 401) {
        toast.info('Please login to add items to cart.')
      } else {
        setCartAdded(true)
        toast.success('Added to cart! 🛒')
      }
    } catch {
      toast.error('Failed to add to cart.')
    } finally {
      setCartLoading(false)
    }
  }, [project.id])

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
    e.preventDefault()
    if (!screenshotFile) { toast.error('Please upload your payment screenshot.'); return }
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
        setIsCheckoutOpen(false); setStep(1); setEmailInput(''); setScreenshotFile(null); setScreenshotPreview(null)
      } else { toast.error(data.error || 'Failed to submit order.') }
    } catch { toast.error('Something went wrong. Please try again.') }
    finally { setIsSubmitting(false) }
  }

  const buyMessage = encodeURIComponent(`Hi! I want to buy the project "${project.title}" listed on TU Notes Hub. Price: Rs. ${finalPrice}. Please confirm availability.`)
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Back */}
      <Link href="/projects" style={{ color: 'var(--clr-text-3)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Back to Projects
      </Link>

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* ===== LEFT COLUMN: Image gallery + action links ===== */}
        <div style={{ position: 'sticky', top: '90px' }}>
          {/* Main preview: show video if available, else image */}
          <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0d0e1a', marginBottom: '10px' }}>
            {showVideo && youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&rel=0&modestbranding=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : activeImg ? (
              <Image src={activeImg} alt={project.title} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-3)' }}>No preview</div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
              {youtubeId && (
                <div
                  onClick={() => setShowVideo(true)}
                  style={{ width: '56px', height: '40px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: showVideo ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.1)', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', transition: 'border 0.2s' }}
                >
                  ▶️
                </div>
              )}
              {allImages.map((src, i) => (
                <div
                  key={i}
                  onClick={() => { setActiveImg(src); setShowVideo(false) }}
                  style={{ width: '56px', height: '40px', flexShrink: 0, position: 'relative', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: (!showVideo && activeImg === src) ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)', transition: 'border 0.2s' }}
                >
                  <Image src={src} alt={`img-${i}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}>
                🌐 Live Demo
              </a>
            )}
            {project.youtubeUrl && (
              <a href={project.youtubeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}>
                📺 Watch Video
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--clr-text-2)', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}>
                🐙 GitHub (Request Access)
              </a>
            )}
          </div>

          {/* Rating */}
          {project.reviewCount > 0 && (
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '13px' }}>
              {'★'.repeat(Math.round(project.rating))}{'☆'.repeat(5 - Math.round(project.rating))}
              <span style={{ color: 'var(--clr-text-3)' }}>({project.reviewCount})</span>
            </div>
          )}
        </div>

        {/* ===== MIDDLE COLUMN: Description, Features, Tech ===== */}
        <div>
          {/* Badges + Title */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {project.category && <span style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, background: 'rgba(165,180,252,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(165,180,252,0.2)' }}>{project.category}</span>}
            {project.subcategory && <span style={{ fontSize: '11px', color: 'var(--clr-text-3)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>{project.subcategory}</span>}
            {project.projectType && <span style={{ fontSize: '11px', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.2)' }}>{project.projectType}</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, margin: '0 0 10px', lineHeight: 1.2 }}>{project.title}</h1>
          <p style={{ fontSize: '15px', color: 'var(--clr-text-2)', lineHeight: 1.7, margin: '0 0 28px' }}>{project.shortDescription}</p>

          {/* Main Description */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-primary-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>📋 Main Description</h3>
            <div style={{ color: 'var(--clr-text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '14px' }}>{project.description}</div>
          </div>

          {/* Features + Modules */}
          {(project.features || project.modules) && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--clr-primary-h)' }}>✨ Key Features & Modules</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {project.features && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {project.features.split('\n').map((f, i) => f.trim() && (
                      <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '13px' }}>
                        <span style={{ color: '#6ee7b7', flexShrink: 0 }}>•</span> {f.replace(/^[•✓-]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                )}
                {project.modules && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {project.modules.split('\n').map((m, i) => m.trim() && (
                      <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '13px' }}>
                        <span style={{ color: '#a5b4fc' }}>●</span> {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Technology Stack */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--clr-primary-h)' }}>🛠️ Technology Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: techDetails.length ? '16px' : 0 }}>
              {techBadges.map(t => (
                <span key={t} style={{ padding: '5px 14px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '999px', fontSize: '12px', color: '#c7d2fe', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
            {techDetails.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                {techDetails.map(x => (
                  <div key={x.label}>
                    <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{x.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{x.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Pricing & Action Card ===== */}
        <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Pricing Card */}
          <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(10,10,26,0.95), rgba(14,12,32,0.95))', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Pricing & Action Card</div>

            {/* Price */}
            {project.discountPercentage > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>Rs. {project.originalPrice}</span>
                <span style={{ fontSize: '11px', background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>-{project.discountPercentage}%</span>
              </div>
            )}
            <div style={{ fontSize: '42px', fontWeight: 900, color: '#6ee7b7', lineHeight: 1.1, marginBottom: '4px' }}>Rs. {finalPrice}</div>

            {/* Countdown Timer */}
            {discountEndsAt && <CountdownTimer endsAt={discountEndsAt} />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'opacity 0.2s' }}
              >
                🛒 Buy Now
              </button>

              <button
                onClick={cartAdded ? undefined : handleAddToCart}
                disabled={cartLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: cartAdded ? 'rgba(110,231,183,0.1)' : 'rgba(99,102,241,0.08)', border: `1px solid ${cartAdded ? 'rgba(110,231,183,0.3)' : 'rgba(99,102,241,0.25)'}`, borderRadius: '12px', color: cartAdded ? '#6ee7b7' : '#a5b4fc', fontSize: '14px', fontWeight: 600, cursor: cartAdded ? 'default' : 'pointer', width: '100%', transition: 'all 0.2s' }}
              >
                {cartLoading ? '⏳ Adding...' : cartAdded ? '✓ Added to Cart' : '🛍️ Add to Cart'}
              </button>

              {buyUrl ? (
                <a href={buyUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', color: '#86efac', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
                  💬 Chat with Seller
                </a>
              ) : null}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
              Secure direct checkout with payment verification.
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

            {/* Developer */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Developer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {isAdmin ? '🛡️' : '👨‍💻'}
                </div>
                <div>
                  {project.sellerId ? (
                    <Link href={`/projects/developer/${project.user?.id}`} style={{ textDecoration: 'none', fontWeight: 700, fontSize: '13px', color: '#fff' }}>{developerName}</Link>
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{developerName}</div>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, background: isAdmin ? 'linear-gradient(90deg, rgba(6,182,212,0.25), rgba(99,102,241,0.25))' : isVerified ? 'linear-gradient(90deg, rgba(110,231,183,0.2), rgba(99,102,241,0.2))' : 'rgba(255,255,255,0.06)', color: isAdmin ? '#67e8f9' : isVerified ? '#6ee7b7' : 'var(--clr-text-3)', padding: '2px 8px', borderRadius: '20px', marginTop: '3px', border: `1px solid ${isAdmin ? 'rgba(6,182,212,0.3)' : isVerified ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                    {isAdmin ? '🛡️ Platform Publisher' : isVerified ? '✓ Verified Seller' : 'Dev Seller'}
                  </span>
                </div>
              </div>
            </div>

            {/* License / Sales Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {[{ l: 'License', v: project.license || 'Standard' }, { l: 'Sales Type', v: project.salesType || 'Non-Exclusive' }].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--clr-text-3)' }}>{row.l}</span>
                  <span style={{ fontWeight: 600 }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsored Ad area */}
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sponsored Advertisement</span>
              <span style={{ fontSize: '11px', color: 'var(--clr-text-3)', cursor: 'default' }}>ⓘ</span>
            </div>
            <Link href="/pricing" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '10px', padding: '20px 10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>300 × 250 Ad Area</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>TU Notes Hub Premium</span>
                <span style={{ background: '#fff', color: '#6366f1', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>Upgrade Now</span>
              </div>
            </Link>
          </div>

          {/* Trust badge */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(110,231,183,0.05)', borderRadius: '10px', border: '1px solid rgba(110,231,183,0.15)', fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
            🔒 <span>All projects are <strong>admin-verified</strong> before listing. Source code delivered after confirmed payment.</span>
          </div>
        </div>
      </div>

      {/* ===== MOBILE LAYOUT: show action card below on small screens ===== */}
      <style>{`
        @media (max-width: 1024px) {
          .project-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .project-left-col { order: 1; }
          .project-mid-col { order: 3; }
          .project-right-col { position: static !important; order: 2; }
        }
        @media (max-width: 768px) {
          .project-features-grid { grid-template-columns: 1fr !important; }
          .project-tech-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

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
                <button onClick={() => { setIsCheckoutOpen(false); setStep(1) }} style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '24px', cursor: 'pointer' }}>×</button>
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
                  <div style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: '10px', padding: '12px 16px', fontSize: '11px', color: 'var(--clr-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                    ⏱️ <strong>Payment Verification:</strong> Admin will verify and approve delivery within 24 hours. Files sent to <strong>{emailInput}</strong>.
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>{isSubmitting ? 'Submitting...' : 'Submit Order'}</button>
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
