'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'

export default function AdminPricingTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editPlan, setEditPlan] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (e) {
      toast.error('Failed to load pricing plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPlan)
      })
      if (res.ok) {
        toast.success('Pricing plan updated!')
        setEditPlan(null)
        fetchPlans()
      } else {
        toast.error('Failed to update')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleFeatureChange = (index: number, field: string, value: any) => {
    const newFeatures = [...editPlan.features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    setEditPlan({ ...editPlan, features: newFeatures })
  }

  const addFeature = () => {
    setEditPlan({
      ...editPlan,
      features: [...editPlan.features, { icon: '✨', text: 'New feature', avail: true }]
    })
  }

  const removeFeature = (index: number) => {
    const newFeatures = [...editPlan.features]
    newFeatures.splice(index, 1)
    setEditPlan({ ...editPlan, features: newFeatures })
  }

  if (loading) return <div>Loading...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="section-title">💰 Manage Pricing Plans</h3>
      <p style={{ color: 'var(--clr-text-3)', marginBottom: '24px', fontSize: '14px' }}>
        Edit the pricing, discounts, and countdown timers for the platform's subscription packages.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {plans.map(plan => (
          <div key={plan.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '24px' }}>{plan.emoji}</span>
                <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{plan.name}</h4>
                <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', textTransform: 'uppercase' }}>{plan.packageType}</p>
              </div>
              {plan.popular && <span className="badge badge-elite">POPULAR</span>}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: plan.color }}>
                {plan.price}
                {plan.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--clr-text-3)', fontSize: '14px', marginLeft: '8px' }}>{plan.originalPrice}</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--clr-text-2)' }}>/ {plan.priceNote}</div>
              
              {plan.discountEndsAt && new Date(plan.discountEndsAt) > new Date() && (
                <div style={{ marginTop: '12px', color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>
                  ⏳ Discount Active
                </div>
              )}
            </div>

            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: 'auto' }}
              onClick={() => setEditPlan(plan)}
            >
              ✏️ Edit Plan
            </button>
          </div>
        ))}
      </div>

      {editPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setEditPlan(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card"
            style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Edit {editPlan.name}</h2>
              <button onClick={() => setEditPlan(null)} style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--clr-text-2)' }}>Name</label>
                  <input required className="input-field" value={editPlan.name} onChange={e => setEditPlan({...editPlan, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--clr-text-2)' }}>Tagline</label>
                  <input required className="input-field" value={editPlan.tagline} onChange={e => setEditPlan({...editPlan, tagline: e.target.value})} />
                </div>
              </div>

              {/* Pricing */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)' }}>💰 Pricing & Discount</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--clr-text-2)' }}>Offer Price (Current)</label>
                    <input required className="input-field" placeholder="e.g. Rs. 99" value={editPlan.price} onChange={e => setEditPlan({...editPlan, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--clr-text-2)' }}>Standard Price (Crossed out)</label>
                    <input className="input-field" placeholder="e.g. Rs. 199 (Optional)" value={editPlan.originalPrice || ''} onChange={e => setEditPlan({...editPlan, originalPrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--clr-text-2)' }}>Discount End Date (Timer)</label>
                    <input 
                      type="datetime-local" 
                      className="input-field" 
                      value={editPlan.discountEndsAt ? new Date(new Date(editPlan.discountEndsAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''} 
                      onChange={e => setEditPlan({...editPlan, discountEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null})} 
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                      <input type="checkbox" checked={editPlan.popular} onChange={e => setEditPlan({...editPlan, popular: e.target.checked})} />
                      Show "MOST POPULAR" Badge
                    </label>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)' }}>✨ Features List</h4>
                  <button type="button" className="btn btn-sm btn-outline" onClick={addFeature}>+ Add Feature</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {editPlan.features.map((feat: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
                      <input type="checkbox" checked={feat.avail} onChange={e => handleFeatureChange(idx, 'avail', e.target.checked)} title="Is Available?" />
                      <input className="input-field" style={{ width: '60px', textAlign: 'center', padding: '8px' }} value={feat.icon} onChange={e => handleFeatureChange(idx, 'icon', e.target.value)} placeholder="Icon" />
                      <input className="input-field" style={{ flex: 1, padding: '8px' }} value={feat.text} onChange={e => handleFeatureChange(idx, 'text', e.target.value)} placeholder="Feature text" />
                      <button type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', padding: '4px' }} onClick={() => removeFeature(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditPlan(null)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ background: editPlan.gradient, border: 'none' }}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
