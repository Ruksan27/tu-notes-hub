'use client'
// src/app/cart/page.tsx
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'

interface CartItem {
  id: string
  projectItemId: string
  createdAt: string
  projectItem: {
    id: string
    title: string
    thumbnailUrl: string | null
    originalPrice: number
    discountPercentage: number
    category: string | null
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [emailInput, setEmailInput] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentQr, setPaymentQr] = useState<string | null>(null)

  // Load settings for QR code
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.paymentQrUrl) setPaymentQr(d.settings.paymentQrUrl)
      })
      .catch(() => {})
  }, [])

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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screenshotFile) {
      toast.error('Please upload your payment screenshot.')
      return
    }
    setIsSubmitting(true)

    try {
      // Loop over items and create an order for each
      const orderPromises = items.map(async (item) => {
        const price = getPrice(item)
        const fd = new FormData()
        fd.append('projectId', item.projectItem.id)
        fd.append('email', emailInput)
        fd.append('amount', String(price))
        fd.append('screenshot', screenshotFile)

        const res = await fetch('/api/project-orders', {
          method: 'POST',
          body: fd
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `Failed to purchase "${item.projectItem.title}"`)
        }
        
        // Sequentially remove the item from cart
        await fetch(`/api/cart?projectItemId=${item.projectItemId}`, { method: 'DELETE' })
      })

      await Promise.all(orderPromises)

      toast.success('All orders submitted successfully! Check your email for confirmation.')
      setIsCheckoutOpen(false)
      setStep(1)
      setEmailInput('')
      setScreenshotFile(null)
      setScreenshotPreview(null)
      // Refresh cart items to show empty state
      setItems([])
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function fetchCart() {
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, [])

  async function handleRemove(projectItemId: string) {
    setRemoving(projectItemId)
    try {
      await fetch(`/api/cart?projectItemId=${projectItemId}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.projectItemId !== projectItemId))
    } finally {
      setRemoving(null)
    }
  }

  const getPrice = (item: CartItem) => {
    const p = item.projectItem
    return p.discountPercentage > 0
      ? Math.round(p.originalPrice * (1 - p.discountPercentage / 100))
      : p.originalPrice
  }

  const total = items.reduce((sum, i) => sum + getPrice(i), 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
        <Link href="/projects" style={{ color: 'var(--clr-text-3)', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Projects
        </Link>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
        🛒 My Cart
      </h1>
      <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '32px' }}>
        {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}
      </p>

      {loading ? (
        /* Skeleton */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--clr-text-3)', marginBottom: '24px' }}>
            Browse projects and add them to your cart.
          </p>
          <Link href="/projects" className="btn btn-primary">
            Browse Projects
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {items.map(item => {
              const price = getPrice(item)
              const isRemoving = removing === item.projectItemId
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', gap: '16px', alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px', padding: '16px',
                    opacity: isRemoving ? 0.5 : 1, transition: 'opacity 0.2s'
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '90px', height: '60px', borderRadius: '8px',
                    overflow: 'hidden', flexShrink: 0, position: 'relative',
                    background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    {item.projectItem.thumbnailUrl ? (
                      <Image src={item.projectItem.thumbnailUrl} alt={item.projectItem.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px' }}>📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/projects/${item.projectItem.id}`}
                      style={{ fontWeight: 700, fontSize: '15px', color: 'var(--clr-text-1)', textDecoration: 'none', display: 'block', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.projectItem.title}
                    </Link>
                    {item.projectItem.category && (
                      <span style={{ fontSize: '11px', color: '#a5b4fc', background: 'rgba(165,180,252,0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(165,180,252,0.2)' }}>
                        {item.projectItem.category}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#6ee7b7' }}>Rs. {price}</div>
                    {item.projectItem.discountPercentage > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                        Rs. {item.projectItem.originalPrice}
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item.projectItemId)}
                    disabled={isRemoving}
                    title="Remove from cart"
                    style={{
                      flexShrink: 0, width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px', cursor: isRemoving ? 'not-allowed' : 'pointer',
                      color: '#fca5a5', fontSize: '16px', transition: 'background 0.2s'
                    }}
                  >
                    {isRemoving ? '⏳' : '🗑️'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Order Summary (sticky) */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <div style={{
              background: 'linear-gradient(160deg, rgba(14,12,32,0.98), rgba(8,6,20,0.98))',
              border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '22px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--clr-text-1)' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--clr-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {item.projectItem.title}
                    </span>
                    <span style={{ fontWeight: 600, flexShrink: 0 }}>Rs. {getPrice(item)}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#6ee7b7' }}>Rs. {total}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'opacity 0.2s',
                    marginTop: '10px'
                  }}
                >
                  🛍️ Proceed to Checkout
                </button>
                <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                  Secure checkout with manual payment verification.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

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
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>🛍️ Checkout — {items.length} Project{items.length !== 1 ? 's' : ''}</h3>
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
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', textAlign: 'center', marginBottom: '16px', lineHeight: 1.6 }}>
                      Scan the QR code below to transfer <strong>Rs. {total}</strong>. Upload the transaction screenshot below.
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

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 700px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
