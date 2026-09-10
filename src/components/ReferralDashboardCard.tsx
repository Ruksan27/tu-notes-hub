'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

interface ReferralDashboardCardProps {
  user: {
    referralCode?: string | null
    successfulPaidReferrals?: number
    packageType?: string
  }
  onUserUpdate?: (updatedFields: Partial<ReferralDashboardCardProps['user']>) => void
}

export default function ReferralDashboardCard({ user, onUserUpdate }: ReferralDashboardCardProps) {
  const [currentCode, setCurrentCode] = useState<string>(user.referralCode || '')
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [claimingMilestone, setClaimingMilestone] = useState<'SEMESTER_PASS' | 'ELITE_AI' | null>(null)

  const paidCount = user.successfulPaidReferrals || 0
  const referralLink = currentCode ? `https://tunoteshub.me/register?ref=${currentCode}` : ''

  const handleGenerateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/user/referral/generate', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.referralCode) {
        setCurrentCode(data.referralCode)
        toast.success(data.message || 'New Referral Code generated! 🎉')
        if (onUserUpdate) {
          onUserUpdate({ referralCode: data.referralCode })
        }
      } else {
        toast.error(data.error || 'Failed to generate code')
      }
    } catch {
      toast.error('Network error while generating code')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = () => {
    if (!currentCode) return
    navigator.clipboard.writeText(currentCode)
    setCopiedCode(true)
    toast.info('Referral Code copied to clipboard!')
    setTimeout(() => setCopiedCode(false), 3000)
  }

  const handleCopyLink = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    toast.info('Referral Link copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 3000)
  }

  const handleWhatsAppShare = () => {
    if (!currentCode) return
    const text = encodeURIComponent(
      `Hey! Use my referral code "${currentCode}" to get 10% OFF on TU Notes Hub premium plans: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // Claim Reward Handler
  const handleClaimPass = async (milestone: 'SEMESTER_PASS' | 'ELITE_AI') => {
    setClaimingMilestone(milestone)
    try {
      const res = await fetch('/api/user/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone })
      })
      const data = await res.json()
      if (res.ok && data.user) {
        toast.success(data.message || 'Pass claimed & activated successfully! 🎉')
        
        // Update local user state in parent component & localStorage
        if (onUserUpdate) {
          onUserUpdate({
            successfulPaidReferrals: data.user.successfulPaidReferrals,
            packageType: data.user.packageType
          })
        }
        try {
          const stored = localStorage.getItem('tu_user')
          if (stored) {
            const parsed = JSON.parse(stored)
            parsed.successfulPaidReferrals = data.user.successfulPaidReferrals
            parsed.packageType = data.user.packageType
            localStorage.setItem('tu_user', JSON.stringify(parsed))
          }
        } catch {}
      } else {
        toast.error(data.error || 'Failed to claim pass')
      }
    } catch {
      toast.error('Network error while claiming pass')
    } finally {
      setClaimingMilestone(null)
    }
  }

  // Progress calculations
  const semesterProgress = Math.min(100, Math.round((paidCount / 5) * 100))
  const eliteProgress = Math.min(100, Math.round((paidCount / 8) * 100))

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 34, 64, 0.9))',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '20px',
      padding: '24px',
      color: '#fff',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      marginBottom: '24px'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎁</span> Refer Friends & Earn Free Premium Plans
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Friends get <strong>10% OFF</strong> when upgrading, and you unlock free Semester & Elite AI passes!
          </p>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
          {paidCount} Successful Paid Referrals
        </div>
      </div>

      {/* Code Generation & Action Box */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px dashed rgba(56, 189, 248, 0.3)',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              Your Unique Referral Code
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: currentCode ? '#38bdf8' : '#64748b', letterSpacing: '1px', marginTop: '2px' }}>
              {currentCode || 'No Code Generated Yet'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {generating ? '⏳ Generating...' : currentCode ? '⚡ Regenerate Code' : '✨ Generate Code'}
            </button>

            {currentCode && (
              <button
                onClick={handleCopyCode}
                style={{
                  background: copiedCode ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copiedCode ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            )}
          </div>
        </div>

        {currentCode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.04)',
            padding: '10px 14px',
            borderRadius: '10px',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12.5px', color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
              🔗 {referralLink}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopyLink}
                style={{
                  background: copiedLink ? '#22c55e' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copiedLink ? '✓ Copied Link!' : 'Copy Link'}
              </button>
              <button
                onClick={handleWhatsAppShare}
                style={{
                  background: '#25d366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Milestone Progress Tracker & Claim Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Milestone 1: 5 Referrals -> Free Semester Pass */}
        <div style={{
          background: paidCount >= 5 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${paidCount >= 5 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: paidCount >= 5 ? '#4ade80' : '#fcd34d' }}>
                🎓 Milestone 1: Free Semester Pass
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{paidCount}/5</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${semesterProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Get 5 paid referrals to unlock 6 Months Semester Pass.
            </p>
          </div>

          {/* Claim Button for Milestone 1 */}
          {paidCount >= 5 ? (
            <button
              onClick={() => handleClaimPass('SEMESTER_PASS')}
              disabled={claimingMilestone !== null}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: claimingMilestone !== null ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {claimingMilestone === 'SEMESTER_PASS' ? '⏳ Activating Pass...' : '🎁 Claim Semester Pass Now!'}
            </button>
          ) : (
            <button
              disabled
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#64748b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              🔒 Claim Semester Pass ({paidCount}/5)
            </button>
          )}
        </div>

        {/* Milestone 2: 8 Referrals -> Free Yearly Elite AI Pass */}
        <div style={{
          background: paidCount >= 8 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${paidCount >= 8 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: paidCount >= 8 ? '#4ade80' : '#38bdf8' }}>
                🚀 Milestone 2: Free Yearly Elite AI Pass
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{paidCount}/8</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${eliteProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Get 8 paid referrals to unlock 1 Year Elite AI Pass.
            </p>
          </div>

          {/* Claim Button for Milestone 2 */}
          {paidCount >= 8 ? (
            <button
              onClick={() => handleClaimPass('ELITE_AI')}
              disabled={claimingMilestone !== null}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: claimingMilestone !== null ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {claimingMilestone === 'ELITE_AI' ? '⏳ Activating Pass...' : '🚀 Claim Elite AI Pass Now!'}
            </button>
          ) : (
            <button
              disabled
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#64748b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              🔒 Claim Elite AI Pass ({paidCount}/8)
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
