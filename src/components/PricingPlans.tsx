'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'motion/react'

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)

  useEffect(() => {
    const end = new Date(targetDate).getTime()
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = end - now
      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft(null)
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) return null
  return (
    <div style={{ marginTop: '12px', background: 'linear-gradient(90deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '15px' }}>⏳</span> Discount Ends In:
      </span>
      <div style={{ display: 'flex', gap: '6px', color: '#fcd34d', fontWeight: 800, fontSize: '13px' }}>
        <div style={{ background: 'rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{timeLeft.d}d</div>
        <div style={{ background: 'rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{timeLeft.h}h</div>
        <div style={{ background: 'rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{timeLeft.m}m</div>
        <div style={{ background: 'rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: '4px', width: '32px', textAlign: 'center' }}>{timeLeft.s}s</div>
      </div>
    </div>
  )
}

interface Plan {
  id: string
  emoji: string
  name: string
  tagline: string
  price: string
  priceNote: string
  validity: string | null
  color: string
  gradient: string
  glow: string
  popular: boolean
  audience: string
  features: { icon: string; text: string; avail: boolean }[]
  cta: string
  ctaStyle: string
  originalPrice?: string
  discountEndsAt?: string
}

// Plans are now fetched from the database via API.
// A fallback plan array is still used to prevent flashing on first load.
const fallbackPlans: Plan[] = []

const comparisons = [
  { feature: 'Browse Notes & Past Papers', free: true, semester: true, elite: true },
  { feature: 'Download Files', free: '10s Wait', semester: 'Instant ⚡', elite: 'Instant ⚡' },
  { feature: 'Advertisements', free: 'Full Ads 📢', semester: 'Zero Ads 🚫', elite: 'Zero Ads 🚫' },
  { feature: 'Handwritten Notes', free: false, semester: true, elite: true },
  { feature: 'Expert Cheatsheets', free: false, semester: false, elite: true },
  { feature: 'AI Exam Predictions', free: false, semester: false, elite: true },
  { feature: 'AI Tutor Chat', free: false, semester: false, elite: true },
  { feature: 'Note Summarizer', free: false, semester: false, elite: true },
  { feature: 'PDF Export of Reports', free: false, semester: false, elite: true },
  { feature: 'Validity', free: 'Forever', semester: '6 Months', elite: '1 Year' },
]

function CheckMark({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)' }}>{val}</span>
  return val
    ? <span style={{ fontSize: '18px', color: '#10b981' }}>✓</span>
    : <span style={{ fontSize: '18px', color: '#374151' }}>—</span>
}

export default function PricingPlans() {
  interface User {
    id: string
    name: string
    email: string
  }

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  // Modal states
  const [txnId, setTxnId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  interface SiteSettings {
    paymentQrUrl?: string
  }

  interface APIPlan extends Omit<Plan, 'id'> {
    packageType: string
  }

  const [plans, setPlans] = useState<Plan[]>(fallbackPlans)
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('tu_user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) } catch { }
    }

    // Fetch dynamic pricing plans
    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(data => {
        if (data.plans) {
          setPlans(data.plans.map((p: APIPlan) => ({
            ...p,
            id: p.packageType, // Map packageType to id to maintain existing logic
            features: p.features ? [...p.features].sort((a: { avail: boolean }, b: { avail: boolean }) => Number(b.avail) - Number(a.avail)) : []
          })))
        }
      })
      .catch(console.error)

    // Fetch site settings for QR code
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => setSettings(data.settings))
      .catch(console.error)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handlePlanClick(plan: Plan) {
    if (plan.id === 'FREE') {
      window.location.href = '/'
      return
    }

    if (!currentUser) {
      toast.warn('Please login first to upgrade your plan! 🔐')
      setTimeout(() => {
        window.location.href = `/login`
      }, 1500)
      return
    }

    setSelectedPlan(plan)
    setTxnId('')
    setScreenshot(null)
    setScreenshotPreview(null)
    setDone(false)
    setAgreeTerms(false)
    setAgreePrivacy(false)
  }

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!txnId.trim() || !selectedPlan) {
      toast.error('Transaction ID is required')
      return
    }
    if (!agreeTerms || !agreePrivacy) {
      toast.error('You must agree to the Terms of Service and Privacy Policy.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('transactionId', txnId)
      formData.append('packageType', selectedPlan.id)
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setDone(true)
        toast.success('Reference submitted! Verification pending. 🎉')
      } else {
        toast.error(data.error || 'Failed to submit payment details')
      }
    } catch {
      toast.error('Connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{ position: 'relative', padding: '80px 24px 40px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container text-center" style={{ position: 'relative', maxWidth: '720px' }}>
          <div className="badge badge-elite" style={{ marginBottom: '20px', display: 'inline-flex', padding: '6px 16px', fontSize: '12px' }}>
            💎 Simple & Transparent Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.1, marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
            Plans Built for<br />
            <span className="text-gradient">Every TU Student</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '17px', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 12px' }}>
            Start free. Upgrade when you need more. Pay with eSewa, Khalti, or Fonepay — no cards needed.
          </p>
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="container" style={{ padding: '0 24px 64px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1080px',
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              position: 'relative',
              borderRadius: '20px',
              padding: plan.popular ? '2px' : '0',
              background: plan.popular ? plan.gradient : 'transparent',
              boxShadow: plan.popular ? `0 0 60px ${plan.glow}` : 'none',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.gradient,
                  color: '#fff',
                  padding: '5px 20px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                }}>🔥 MOST POPULAR</div>
              )}

              <div style={{
                background: 'var(--clr-bg-700)',
                borderRadius: plan.popular ? '18px' : '20px',
                border: plan.popular ? 'none' : '1px solid var(--clr-border)',
                padding: '32px 28px',
                height: '100%',
              }}>
                {/* Plan header */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    width: '52px', height: '52px',
                    borderRadius: '14px',
                    background: plan.popular ? plan.gradient : `${plan.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', marginBottom: '16px',
                    border: `1px solid ${plan.color}30`,
                  }}>{plan.emoji}</div>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    {plan.audience}
                  </p>
                  <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>{plan.name}</h2>
                  <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>{plan.tagline}</p>
                </div>


                {/* Price */}
                <div style={{
                  background: plan.popular ? `${plan.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${plan.color}25`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                    {/* Original Price (if discount exists) */}
                    {plan.originalPrice && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-elite" style={{ fontSize: '10px', padding: '2px 6px', background: '#f59e0b', color: '#000', border: 'none' }}>
                          SAVE {Math.round((1 - parseInt(plan.price.replace(/\D/g, '')) / parseInt(plan.originalPrice.replace(/\D/g, ''))) * 100)}%
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                          {plan.originalPrice}
                        </span>
                      </div>
                    )}

                    {/* Current Price & Note */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '40px', fontWeight: 900, color: plan.color, fontFamily: 'var(--font-display)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                        {plan.price}
                      </span>
                      <span style={{ color: 'var(--clr-text-3)', fontSize: '14px', whiteSpace: 'nowrap' }}>/ {plan.priceNote}</span>
                    </div>

                  </div>

                  {plan.validity && (
                    <p style={{ color: plan.color, fontSize: '13px', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📅 {plan.validity}
                    </p>
                  )}
                  {plan.discountEndsAt && new Date(plan.discountEndsAt) > new Date() && (
                    <CountdownTimer targetDate={plan.discountEndsAt} />
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features.map((f) => (
                    <li key={f.text} style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      fontSize: '14px',
                      color: f.avail ? 'var(--clr-text-2)' : 'var(--clr-text-3)',
                    }}>
                      <span style={{
                        flexShrink: 0, marginTop: '1px',
                        color: f.avail ? (plan.popular ? plan.color : 'var(--clr-success)') : '#374151',
                        fontWeight: 700,
                        fontSize: '16px',
                      }}>
                        {f.avail ? '✓' : '✗'}
                      </span>
                      <span>
                        <span style={{ marginRight: '6px' }}>{f.icon}</span>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    ...(plan.ctaStyle === 'primary' ? {
                      background: plan.gradient,
                      color: '#fff',
                      border: 'none',
                      boxShadow: `0 6px 24px ${plan.glow}`,
                    } : plan.ctaStyle === 'accent' ? {
                      background: `${plan.color}20`,
                      color: plan.color,
                      border: `1.5px solid ${plan.color}50`,
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--clr-text-2)',
                      border: '1.5px solid var(--clr-border)',
                    }),
                  }}
                >
                  {plan.cta} {plan.id !== 'FREE' && '→'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison Table ── */}
      <div className="container" style={{ padding: '0 24px 64px' }}>
        <h2 className="text-center" style={{ fontSize: 'clamp(24px,3.5vw,38px)', marginBottom: '40px' }}>
          Full Feature <span className="text-gradient">Comparison</span>
        </h2>

        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--clr-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-3)', borderBottom: '1px solid var(--clr-border)' }}>
                  Feature
                </th>
                {[
                  { label: '🌱 Free', color: '#64748b' },
                  { label: '⚡ Semester', color: '#06b6d4' },
                  { label: '🤖 Elite AI', color: '#6366f1' },
                ].map((col) => (
                  <th key={col.label} style={{
                    padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 700,
                    color: col.color, borderBottom: '1px solid var(--clr-border)',
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: 'var(--clr-text-2)', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.free} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.semester} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.elite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="container" style={{ padding: '0 24px 64px', maxWidth: '720px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
          border: '1px solid var(--clr-border-h)',
          borderRadius: '20px',
          padding: '36px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>💳 How to Pay?</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.7 }}>
            We accept QR-based payments. Scan the QR, pay, and submit your transaction ID along with screenshot — your account gets activated within 1-2 hours.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['📱 eSewa', '💜 Khalti', '🏦 Fonepay', '🔵 ConnectIPS'].map((method) => (
              <div key={method} style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--clr-border)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--clr-text-2)',
              }}>{method}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Checkout Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8, 10, 18, 0.8)',
              backdropFilter: 'blur(8px)',
              padding: '20px',
            }}
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '32px',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: `1px solid ${selectedPlan.color}40`,
                boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 40px ${selectedPlan.glow}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Close */}
              <button
                onClick={() => { setSelectedPlan(null); setAgreeTerms(false); setAgreePrivacy(false) }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--clr-text-3)',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ✕
              </button>

              {!done ? (
                <form onSubmit={handleCheckoutSubmit}>
                  {/* Modal Header */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '32px' }}>{selectedPlan.emoji}</span>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                      Upgrade to <span style={{ color: selectedPlan.color }}>{selectedPlan.name}</span>
                    </h3>
                    <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', marginTop: '4px' }}>
                      Verify transaction to unlock premium academic tools
                    </p>
                  </div>

                  {/* QR Image Mock */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {/* Stylized QR or Mockup */}
                      <div style={{ width: '180px', height: '180px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                        {settings?.paymentQrUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`/api/file-proxy?url=${encodeURIComponent(settings.paymentQrUrl.replace('http://', 'https://'))}`}
                            alt="Payment QR"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>[ QR SCAN MOCKUP ]</span>
                        )}
                        <div style={{ position: 'absolute', border: '4px solid #10b981', inset: '0px', pointerEvents: 'none' }}></div>
                      </div>
                      <span style={{ color: '#000', fontSize: '14px', fontWeight: 800 }}>
                        {selectedPlan.price} {selectedPlan.priceNote}
                      </span>
                    </div>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '12px', marginTop: '12px', textAlign: 'center', maxWidth: '340px' }}>
                      Scan the QR code with eSewa, Khalti, or FonePay, complete the transfer of <strong>{selectedPlan.price}</strong>, and enter reference below.
                    </p>
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>
                        1. Transaction Reference ID <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="e.g. REF-8374928"
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        style={{ padding: '12px 16px', fontSize: '14px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)', marginBottom: '8px' }}>
                        2. Upload Payment Screenshot (Optional but Recommended)
                      </label>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 2,
                          }}
                        />
                        <div
                          style={{
                            border: '2px dashed var(--clr-border)',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>📸</span>
                          <span style={{ fontSize: '13px', color: 'var(--clr-text-2)', fontWeight: 600 }}>
                            {screenshot ? screenshot.name : 'Click to Upload screenshot'}
                          </span>
                          <span style={{ fontSize: '11px', display: 'block', color: 'var(--clr-text-3)', marginTop: '4px' }}>
                            PNG, JPG or JPEG
                          </span>
                        </div>
                      </div>

                      {screenshotPreview && (
                        <div style={{ marginTop: '12px', position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--clr-border)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={screenshotPreview} alt="Screenshot Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', textAlign: 'left' }}>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                      <span>I Agree to the <Link href="/terms" target="_blank" style={{ color: 'var(--clr-primary-h)', textDecoration: 'underline' }}>Terms of Service</Link></span>
                    </label>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                      <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} required style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                      <span>I Agree to the <Link href="/privacy" target="_blank" style={{ color: 'var(--clr-primary-h)', textDecoration: 'underline' }}>Privacy Policy</Link></span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setSelectedPlan(null)}
                      style={{ padding: '12px 20px', fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !txnId.trim()}
                      className="btn btn-primary"
                      style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 700,
                        background: selectedPlan.gradient,
                        border: 'none',
                        boxShadow: `0 4px 16px ${selectedPlan.glow}`,
                      }}
                    >
                      {submitting ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Submitting...</> : '✅ I Have Paid — Submit'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Done / "I am done" Success Screen */
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ textAlign: 'center', padding: '16px 8px' }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--clr-success)', marginBottom: '12px' }}>
                    Verification Pending!
                  </h3>
                  <p style={{ color: 'var(--clr-text-2)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
                    Thank you! Your payment details and transaction reference <strong>({txnId})</strong> have been successfully submitted to our admin team.
                    <br /><br />
                    We will verify the screenshot and reference within <strong>1–2 hours</strong> and activate your premium <strong>{selectedPlan.name}</strong> access.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedPlan(null)
                        window.location.href = '/dashboard'
                      }}
                      style={{ justifyContent: 'center', width: '100%', padding: '14px', fontSize: '15px' }}
                    >
                      🚀 Go to My Learning Dashboard
                    </button>

                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedPlan(null)}
                      style={{ justifyContent: 'center', width: '100%', padding: '14px', fontSize: '15px' }}
                    >
                      Done, Close Modal
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
