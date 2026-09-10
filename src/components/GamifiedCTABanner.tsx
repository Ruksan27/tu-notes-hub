'use client';

import React from 'react';
import Link from 'next/link';
import { UploadCloud, Users, TrendingUp } from 'lucide-react';

export default function GamifiedCTABanner() {
  return (
    <section className="gamified-cta-banner" style={{
      width: '100%',
      background: 'linear-gradient(135deg, #090d16 0%, #0d1527 50%, #0a1120 100%)',
      padding: '36px 0',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Background subtle glow */}
      <div style={{
        position: 'absolute', top: '-40%', right: '10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', left: '5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '32px',
        position: 'relative',
        zIndex: 2,
      }} className="gamified-cta-inner">

        {/* Left: Text Content */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h2 style={{
            fontSize: 'clamp(24px, 3vw, 34px)',
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 8px 0',
            lineHeight: 1.25,
            fontFamily: 'var(--font-display)',
          }}>
            Upload Notes & Earn Points
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '15px',
            margin: '0 0 18px 0',
            lineHeight: 1.5,
          }}>
            The more you contribute, the more you earn.
          </p>

          {/* Badges Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 16px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#cbd5e1', fontSize: '13px', fontWeight: 500,
            }}>
              <UploadCloud style={{ width: '15px', height: '15px', color: '#67e8f9' }} />
              Upload notes, Earn points
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 16px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#cbd5e1', fontSize: '13px', fontWeight: 500,
            }}>
              <Users style={{ width: '15px', height: '15px', color: '#a5b4fc' }} />
              Help other students, Grow together
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 16px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#cbd5e1', fontSize: '13px', fontWeight: 500,
            }}>
              <TrendingUp style={{ width: '15px', height: '15px', color: '#c4b5fd' }} />
              Climb the leaderboard, Build your profile
            </div>
          </div>
        </div>

        {/* Right: Gift Illustration + Upload Button */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '28px',
          flexShrink: 0,
        }} className="gamified-cta-right">
          {/* Gift Box */}
          <div style={{ fontSize: '72px', lineHeight: 1, position: 'relative' }}>
            🎁
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '18px' }}>✨</span>
            <span style={{ position: 'absolute', top: '-4px', left: '-10px', fontSize: '14px' }}>⭐</span>
            <span style={{ position: 'absolute', bottom: '2px', right: '-14px', fontSize: '12px' }}>✨</span>
          </div>

          {/* Upload Button */}
          <Link
            href="/dashboard/notes/upload"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              padding: '13px 30px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <UploadCloud style={{ width: '18px', height: '18px' }} />
            Upload Now
          </Link>
        </div>
      </div>

      {/* ── Mobile Responsive Styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .gamified-cta-inner {
            flex-direction: column !important;
            text-align: center;
            gap: 24px !important;
            padding: 0 20px !important;
          }
          .gamified-cta-right {
            flex-direction: column !important;
            align-items: center !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
