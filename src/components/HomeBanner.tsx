'use client'

import Link from 'next/link'

export default function HomeBanner() {
  return (
    <section className="section" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '24px',
          padding: '40px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          {/* Background Decorative Glow */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap',
          }}>
            {/* Left Content */}
            <div style={{ flex: '1 1 320px', maxWidth: '640px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '16px',
              }}>
                <span>🎁 Student Rewards Program</span>
              </div>

              <h2 style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 900,
                color: '#fff',
                marginBottom: '12px',
                lineHeight: 1.25,
                letterSpacing: '-0.5px',
              }}>
                Upload Notes & <span className="text-gradient">Earn Points</span>
              </h2>

              <p style={{
                color: 'var(--clr-text-2)',
                fontSize: 'clamp(13.5px, 2vw, 15px)',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}>
                Share your handwritten study notes or solutions with thousands of TU students. Earn reward points for every download and rank on the leaderboards!
              </p>

              {/* Perk Badges */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                  <span style={{ fontSize: '16px' }}>⚡</span> Fast Approval
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                  <span style={{ fontSize: '16px' }}>🎁</span> Redeem Rewards
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                  <span style={{ fontSize: '16px' }}>🏆</span> Top Contributor Badge
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <Link
                  href="/dashboard/notes/upload"
                  className="btn btn-primary btn-lg"
                  style={{
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '15px',
                    padding: '14px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                  }}
                >
                  <span>Upload Notes Now</span>
                  <span style={{ fontSize: '16px' }}>→</span>
                </Link>
              </div>
            </div>

            {/* Right Graphic Badge */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '8px', filter: 'drop-shadow(0 10px 20px rgba(99,102,241,0.4))' }}>
                  🎁
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                  Earn Up To
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  500 Points / Note
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
