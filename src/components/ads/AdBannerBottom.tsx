'use client'
// src/components/ads/AdBannerBottom.tsx
export default function AdBannerBottom() {
  return (
    <div className="ad-banner-bottom adsbox google-ads">
      <div className="container flex-between" style={{ gap: '16px', padding: '8px 24px' }}>
        <span style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
          Ad
        </span>
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 20px',
          textAlign: 'center',
          cursor: 'pointer',
        }}>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '13px' }}>
            🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>TU Notes Hub Premium</strong> — Ad-free + AI Exam Predictions. Upgrade from Rs. 99 only!
          </p>
        </div>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
          onClick={(e) => (e.currentTarget.parentElement!.parentElement!.style.display = 'none')}
        >×</button>
      </div>
    </div>
  )
}
