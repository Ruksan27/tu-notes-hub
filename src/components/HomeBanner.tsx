'use client'

import Link from 'next/link'

export default function HomeBanner() {
  return (
    <section className="section" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="container">
        {/* Main Banner Container */}
        <div style={{
          background: 'linear-gradient(135deg, #0b192c 0%, #112240 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '36px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            position: 'relative',
            zIndex: 1,
            flexWrap: 'wrap'
          }}>
            {/* Left Column */}
            <div style={{ flex: '1 1 320px', maxWidth: '640px' }}>
              <h2 style={{
                fontSize: 'clamp(24px, 4vw, 32px)',
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: '8px',
                lineHeight: 1.25,
              }}>
                Upload Notes & Earn Points
              </h2>

              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}>
                The more you contribute, the more you earn.
              </p>

              {/* Badges Pill Row */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  <span>📑</span> Upload notes, Earn points
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  <span>👥</span> Help other students, Grow together
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  <span>📈</span> Climb the leaderboard, Build your profile
                </div>
              </div>
            </div>

            {/* Right Column: Gift Illustration & CTA Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '48px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }}>
                🎁
              </div>
              <Link
                href="/dashboard/notes/upload"
                style={{
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  padding: '10px 24px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>↑</span> Upload Now
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Strip Below */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          flexWrap: 'wrap'
        }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Start sharing your notes today.
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Join thousands of students earning points by contributing.
            </p>
          </div>
          <Link
            href="/dashboard/notes/upload"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 20px',
              borderRadius: '999px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Upload Notes →
          </Link>
        </div>
      </div>
    </section>
  )
}
