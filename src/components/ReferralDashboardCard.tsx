'use client'

import { useState } from 'react'

interface ReferralDashboardCardProps {
  user: {
    referralCode: string
    successfulPaidReferrals: number
    packageType: string
  }
}

export default function ReferralDashboardCard({ user }: ReferralDashboardCardProps) {
  const [copied, setCopied] = useState(false)
  const referralLink = `https://tunoteshub.me/register?ref=${user.referralCode || 'MYCODE'}`
  const paidCount = user.successfulPaidReferrals || 0

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Use my referral link to get 10% OFF on TU Notes Hub premium plans & past paper predictions: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  // Calculate Progress percentages
  const semesterProgress = Math.min(100, Math.round((paidCount / 5) * 100))
  const eliteProgress = Math.min(100, Math.round((paidCount / 8) * 100))

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 34, 64, 0.9))',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '20px',
      padding: '24px',
      color: '#fff',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      marginBottom: '24px'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎁</span> Refer & Earn Free Premium Plans
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Share your link with friends. They get <strong>10% OFF</strong>, and you unlock free Semester & AI plans!
          </p>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
          {paidCount} Successful Paid Referrals
        </div>
      </div>

      {/* Referral Link Box */}
      <div style={{
        display: 'flex',
        gap: '10px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 14px',
        borderRadius: '12px',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {referralLink}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#22c55e' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        <button
          onClick={handleWhatsAppShare}
          style={{
            background: '#25d366',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          💬 Share on WhatsApp
        </button>
      </div>

      {/* Milestone Progress Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Milestone 1: 5 Referrals */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
            <span style={{ color: paidCount >= 5 ? '#4ade80' : '#fcd34d' }}>
              🎓 Milestone 1: Semester Pass (6 Months)
            </span>
            <span>{paidCount}/5</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${semesterProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '8px 0 0 0' }}>
            {paidCount >= 5 ? '🎉 Unlocked & Active!' : `Need ${5 - paidCount} more paid referral(s) to unlock.`}
          </p>
        </div>

        {/* Milestone 2: 8 Referrals */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
            <span style={{ color: paidCount >= 8 ? '#4ade80' : '#38bdf8' }}>
              🚀 Milestone 2: Elite AI Plan (1 Year)
            </span>
            <span>{paidCount}/8</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${eliteProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '8px 0 0 0' }}>
            {paidCount >= 8 ? '🎉 Unlocked & Active!' : `Need ${8 - paidCount} more paid referral(s) to unlock.`}
          </p>
        </div>
      </div>
    </div>
  )
}
