'use client'

import { useState } from 'react'

interface PointsRedeemModalProps {
  currentPoints: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedUser: any) => void
}

export default function PointsRedeemModal({ currentPoints, isOpen, onClose, onSuccess }: PointsRedeemModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'SEMESTER_PASS' | 'ELITE_AI' | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleRedeemClick = (plan: 'SEMESTER_PASS' | 'ELITE_AI') => {
    const cost = plan === 'SEMESTER_PASS' ? 1200 : 2500
    if (currentPoints < cost) {
      setErrorMsg(`You need ${cost} points to redeem this plan. You currently have ${currentPoints} points.`)
      return
    }
    setErrorMsg('')
    setSelectedPlan(plan)
    setConfirming(true)
  }

  const confirmRedemption = async () => {
    if (!selectedPlan) return
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: selectedPlan })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem points')
      }

      onSuccess(data.user)
      setConfirming(false)
      setSelectedPlan(null)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#0b192c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '540px',
        width: '100%',
        color: '#fff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>🎁 Points Reward Shop</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Your Balance: <strong style={{ color: '#f59e0b' }}>{currentPoints} Points</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Confirmation State */}
        {confirming ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>Confirm Point Deduction</h4>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
              तपाईंको <strong>{selectedPlan === 'SEMESTER_PASS' ? '1200' : '2500'} पोइन्ट</strong> काटिनेछ, र {selectedPlan === 'SEMESTER_PASS' ? '६ महिनाको Semester Pass' : '१ वर्षको Elite AI Plan'} सक्रिय हुनेछ। के तपाईं अघि बढ्न चाहनुहुन्छ?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRedemption}
                disabled={loading}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                {loading ? 'Redeeming...' : 'Yes, Redeem Now! 🎉'}
              </button>
            </div>
          </div>
        ) : (
          /* Reward Plan Cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Semester Pass Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fcd34d' }}>🎓 Semester Pass (6 Months)</div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>Access all handwritten notes & solution books</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>Cost: 1,200 Points</div>
              </div>
              <button
                onClick={() => handleRedeemClick('SEMESTER_PASS')}
                disabled={currentPoints < 1200}
                style={{
                  background: currentPoints >= 1200 ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: currentPoints >= 1200 ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: currentPoints >= 1200 ? 'pointer' : 'not-allowed'
                }}
              >
                {currentPoints >= 1200 ? 'Redeem (1,200 pts)' : 'Need 1,200 pts'}
              </button>
            </div>

            {/* Elite AI Plan Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>🚀 Elite AI Plan (1 Year)</div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>Unlimited AI Doubt Solver + Exam Predictions</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>Cost: 2,500 Points</div>
              </div>
              <button
                onClick={() => handleRedeemClick('ELITE_AI')}
                disabled={currentPoints < 2500}
                style={{
                  background: currentPoints >= 2500 ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'rgba(255,255,255,0.1)',
                  color: currentPoints >= 2500 ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: currentPoints >= 2500 ? 'pointer' : 'not-allowed'
                }}
              >
                {currentPoints >= 2500 ? 'Redeem (2,500 pts)' : 'Need 2,500 pts'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
