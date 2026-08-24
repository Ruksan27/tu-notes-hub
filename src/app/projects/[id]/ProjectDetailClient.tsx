'use client'
import { useEffect, useState } from 'react'
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

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [whatsapp, setWhatsapp] = useState<string | null>(null)
  const [activeImg, setActiveImg] = useState<string | null>(project.thumbnailUrl)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [step, setStep] = useState(1) // 1: Email, 2: QR & Upload
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [paymentQr, setPaymentQr] = useState<string | null>(null)

    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.settings?.whatsappLink) setWhatsapp(d.settings.whatsappLink)
      if (d.settings?.paymentQrUrl) setPaymentQr(d.settings.paymentQrUrl)
    }).catch(() => {})
  }, [project.id])

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))
  const screenshots = [project.screenshot1, project.screenshot2, project.screenshot3, project.screenshot4].filter(Boolean) as string[]
  const allImages = project.thumbnailUrl ? [project.thumbnailUrl, ...screenshots] : screenshots

  const isVerified = !!project.user?.sellerProfile?.isVerified
  const developerName = project.sellerId ? (project.user?.name || 'Seller') : 'TU Notes Admin'
  const isAdmin = !project.sellerId

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) {
      toast.error('Please enter a valid email address.')
      return
    }
    setStep(2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.')
        return
      }
      setScreenshotFile(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screenshotFile) {
      toast.error('Please upload your payment screenshot.')
      return
    }

    setIsSubmitting(true)
    const fd = new FormData()
    fd.append('projectId', project.id)
    fd.append('email', emailInput)
    fd.append('amount', String(finalPrice))
    fd.append('screenshot', screenshotFile)

    try {
      const res = await fetch('/api/project-orders', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Order requested successfully! Check email for receipt.')
        setIsCheckoutOpen(false)
        setStep(1)
        setEmailInput('')
        setScreenshotFile(null)
        setScreenshotPreview(null)
      } else {
        toast.error(data.error || 'Failed to submit order.')
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }



  const buyMessage = encodeURIComponent(
    `Hi! I want to buy the project "${project.title}" listed on TU Notes Hub. Price: Rs. ${finalPrice}. Please confirm availability.`
  )
  const buyUrl = whatsapp ? `${whatsapp}?text=${buyMessage}` : null

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/projects" style={{ color: 'var(--clr-text-3)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Back to Projects
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px', alignItems: 'start' }}>
        {/* Left */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {project.category && (
                <span style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, background: 'rgba(165,180,252,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(165,180,252,0.2)' }}>
                  {project.category}
                </span>
              )}
              {project.subcategory && (
                <span style={{ fontSize: '11px', color: 'var(--clr-text-3)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>
                  {project.subcategory}
                </span>
              )}
              {project.projectType && (
                <span style={{ fontSize: '11px', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.2)' }}>
                  {project.projectType}
                </span>
              )}

            </div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>{project.title}</h1>
            <p style={{ fontSize: '17px', color: 'var(--clr-text-2)', lineHeight: 1.7, margin: 0 }}>{project.shortDescription}</p>
          </div>

          {/* Main Image */}
          {activeImg && (
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', background: '#0d0e1a' }}
            >
              <Image src={activeImg} alt={project.title} fill style={{ objectFit: 'cover' }} />
            </motion.div>
          )}

          {/* Thumbnails strip */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
              {allImages.map((src, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(src)}
                  style={{
                    width: '80px', height: '54px', flexShrink: 0, position: 'relative', borderRadius: '8px',
                    overflow: 'hidden', cursor: 'pointer',
                    border: activeImg === src ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)',
                    transition: 'border 0.2s',
                  }}
                >
                  <Image src={src} alt={`img-${i}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Details Card */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--clr-primary-h)' }}>📋 Project Description</h3>
            <div style={{ color: 'var(--clr-text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '14px' }}>{project.description}</div>
          </div>

          {(project.features || project.modules) && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                {project.features && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>✅ Features</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {project.features.split('\n').map((f, i) => f.trim() && (
                        <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '13px' }}>
                          <span style={{ color: '#6ee7b7', flexShrink: 0 }}>✓</span> {f.replace(/^✓\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {project.modules && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>🧩 Modules</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {project.modules.split('\n').map((m, i) => m.trim() && (
                        <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)', fontSize: '13px' }}>
                          <span style={{ color: '#a5b4fc' }}>●</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--clr-primary-h)' }}>🛠️ Technology Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {project.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} style={{ padding: '5px 14px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '999px', fontSize: '12px', color: '#c7d2fe', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
            {(project.frontend || project.backend || project.dbType || project.framework) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                {[
                  { label: 'Frontend', val: project.frontend },
                  { label: 'Backend', val: project.backend },
                  { label: 'Database', val: project.dbType },
                  { label: 'Framework', val: project.framework },
                  { label: 'Libraries', val: project.libraries },
                ].filter(x => x.val).map(x => (
                  <div key={x.label}>
                    <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{x.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{x.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

        {/* Right Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>

            {/* Price */}
            <div style={{ marginBottom: '20px' }}>
              {project.discountPercentage > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>Rs. {project.originalPrice}</span>
                  <span style={{ fontSize: '11px', background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                    -{project.discountPercentage}%
                  </span>
                </div>
              )}
              <div style={{ fontSize: '38px', fontWeight: 800, color: '#6ee7b7', lineHeight: 1 }}>Rs. {finalPrice}</div>
            </div>

            {/* Buy Now */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '16px', marginBottom: '12px', borderRadius: '12px' }}
            >
              🛒 Buy Now
            </button>
            
            {buyUrl ? (
              <a
                href={buyUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '16px', display: 'flex', textDecoration: 'none', borderRadius: '12px' }}
              >
                💬 Chat with Seller
              </a>
            ) : (
              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '16px', opacity: 0.7 }}
                disabled
              >
                💬 Chat with Seller
              </button>
            )}

            <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5, marginTop: '12px' }}>
              Secure direct checkout with payment verification.
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'License', val: project.license || 'Standard' },
                { label: 'Sales Type', val: project.salesType || 'Non-Exclusive' },
                { label: 'Type', val: project.projectType || 'Software' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{row.val}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

            {/* Developer */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Developer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {isAdmin ? '🛡️' : '👨‍💻'}
                </div>
                <div>
                  {project.sellerId ? (
                    <Link href={`/projects/developer/${project.user?.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#fff', cursor: 'pointer' }} className="hover-underline">
                        {developerName}
                      </div>
                    </Link>
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{developerName}</div>
                  )}
                  {isAdmin ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, background: 'linear-gradient(90deg, rgba(6,182,212,0.25), rgba(99,102,241,0.25))', color: '#67e8f9', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(6,182,212,0.3)' }}>
                      🛡️ Platform Publisher
                    </span>
                  ) : isVerified ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, background: 'linear-gradient(90deg, rgba(110,231,183,0.2), rgba(99,102,241,0.2))', color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.3)' }}>
                      ✓ Verified Seller
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--clr-text-3)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Dev Seller
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Demo Links */}
            {(project.demoUrl || project.youtubeUrl || project.githubUrl) && (
              <>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', textDecoration: 'none' }}>🌐 Live Demo</a>}
                  {project.youtubeUrl && <a href={project.youtubeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.2)', textDecoration: 'none' }}>▶️ Watch Demo</a>}
                  {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', textDecoration: 'none' }}>🐙 GitHub (Request Access)</a>}
                </div>
              </>
            )}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(110,231,183,0.05)', borderRadius: '10px', border: '1px solid rgba(110,231,183,0.15)', fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
              🔒 <span>All projects are <strong>admin-verified</strong> before listing. Source code delivered after confirmed payment.</span>
            </div>
          </div>
        </div>
      </div>

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
                <button onClick={() => { setIsCheckoutOpen(false); setStep(1); }} style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              {step === 1 ? (
                <form onSubmit={handleNextStep}>
                  <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                    Please enter the email address where you want to receive the verified project files (Source code, DB dump, and documentation) after your payment is approved.
                  </p>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--clr-text-3)', marginBottom: '8px', fontWeight: 700 }}>Your Delivery Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      className="input-field"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      style={{ padding: '14px' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    Proceed to Payment →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOrderSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', textAlign: 'center', marginBottom: '16px', lineHeight: 1.6 }}>
                      Scan the QR code below to transfer <strong>Rs. {finalPrice}</strong>. Upload the transaction screenshot below.
                    </p>
                    {/* Placeholder for QR Code */}
                    <div style={{ width: '160px', height: '160px', position: 'relative', background: '#fff', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Image src={paymentQr || "/qr-placeholder.png"} alt="QR Code" fill style={{ objectFit: 'contain', padding: '8px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Merchant: TU Notes Hub</span>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--clr-text-3)', marginBottom: '8px', fontWeight: 700 }}>Upload Payment Screenshot *</label>
                    <div style={{ position: 'relative', border: '2px dashed rgba(99,102,241,0.25)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleFileChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📸</span>
                      <span style={{ fontSize: '13px', color: 'var(--clr-text-2)', fontWeight: 600 }}>
                        {screenshotFile ? screenshotFile.name : 'Click to upload screenshot'}
                      </span>
                    </div>
                    {screenshotPreview && (
                      <div style={{ marginTop: '12px', position: 'relative', width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Image src={screenshotPreview} alt="Screenshot Preview" fill style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(110,231,183,0.05)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: '10px', padding: '12px 16px', fontSize: '11px', color: 'var(--clr-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                    ⏱️ <strong>Payment Request Verification:</strong> Admin will verify your payment and approve the delivery within 24 hours. The files will be sent to <strong>{emailInput}</strong>.
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                      Back
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                      {isSubmitting ? 'Submitting...' : 'Submit Order'}
                    </button>
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
