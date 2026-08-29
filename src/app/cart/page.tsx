'use client'
// src/app/cart/page.tsx
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

              <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', textAlign: 'center', lineHeight: 1.5 }}>
                💡 To purchase, go to each project page and click <strong>Buy Now</strong>.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 700px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
