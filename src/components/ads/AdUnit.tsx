'use client'
import React, { useEffect, useState } from 'react'

interface AdUnitProps {
  type: 'banner' | 'sidebar' | 'inline'
  slot?: string
  style?: React.CSSProperties
}

export default function AdUnit({ type, slot = 'default-slot', style }: AdUnitProps) {
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          setIsPaidUser(true)
          return
        }
      }
    } catch {}

    try {
      // Initialize adsbygoogle script if present
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch (e) {
      // Silently ignore in development or when blocked
    }
  }, [])

  if (isPaidUser) return null

  const getStyle = (): React.CSSProperties => {
    switch (type) {
      case 'banner':
        return {
          width: '100%',
          minHeight: '120px',
          maxHeight: '160px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }
      case 'sidebar':
        return {
          width: '100%',
          minHeight: '420px',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }
      case 'inline':
      default:
        return {
          width: '100%',
          minHeight: '320px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }
    }
  };

  return (
    <div className="adsbox google-ads-wrapper" style={{ margin: '16px 0', width: '100%' }}>
      {/* Label */}
      <div
        style={{
          fontSize: '9px',
          color: 'var(--clr-text-3)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '6px',
          textAlign: 'center',
          fontWeight: 700,
        }}
      >
        Sponsored Advertisement
      </div>

      <div style={getStyle()}>
        {/* Real AdSense Element */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-YOUR_PUBLISHER_ID"}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Beautiful Simulated Placeholder when AdSense doesn't load/blocked */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(6,182,212,0.03))',
            pointerEvents: 'none',
            zIndex: 1,
            padding: '12px',
          }}
        >
          {type === 'banner' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <span style={{ fontSize: '28px' }}>🎓</span>
              <div>
                <span style={{ fontSize: '10px', background: 'var(--clr-primary-h)', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>[ Google AdSense Slot ]</span>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)', margin: 0 }}>
                  Need a Study Boost? Upgrade to Premium!
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--clr-text-2)', margin: '2px 0 0 0' }}>
                  Get complete ad-free experience, direct PDF downloads, and AI Exam Predictions.
                </p>
              </div>
            </div>
          )}

          {type === 'sidebar' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '60px', display: 'block', marginBottom: '14px' }}>💡</span>
              <span style={{ fontSize: '10px', background: 'var(--clr-primary-h)', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>[ Google AdSense Slot ]</span>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--clr-accent)', marginBottom: '10px' }}>
                TU Notes Hub
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                Access the best lecture notes, cheatsheets, and question banks for BCA, CSIT, and BBS.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--grad-brand)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                Learn More
              </div>
            </div>
          )}

          {type === 'inline' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>📱</span>
              <span style={{ fontSize: '10px', background: 'var(--clr-primary-h)', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>[ Google AdSense Slot ]</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                Join our Telegram Group
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Get instant notifications on TU results, schedules, and exam updates.
              </p>
              <span style={{ fontSize: '13px', color: 'var(--clr-primary-h)', fontWeight: 700, border: '1px solid var(--clr-primary-h)', padding: '8px 18px', borderRadius: '6px' }}>
                Join Group →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
