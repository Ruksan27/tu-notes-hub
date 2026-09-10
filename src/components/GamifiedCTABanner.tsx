'use client';

import React from 'react';
import Link from 'next/link';
import { Upload, Users, TrendingUp, UploadCloud } from 'lucide-react';

export default function GamifiedCTABanner() {
  return (
    <section
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #0d213f 0%, #0b1a32 100%)',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        padding: '32px 0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          padding: '0 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '150px',
          position: 'relative',
          zIndex: 2,
        }}
        className="gamified-cta-inner"
      >
        {/* Left: Text & Badges Content */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h2
            style={{
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              lineHeight: 1.25,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em',
            }}
          >
            Upload Notes & Earn Points
          </h2>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '13.5px',
              margin: '0 0 16px 0',
              lineHeight: 1.4,
            }}
          >
            The more you contribute, the more you earn.
          </p>

          {/* Badges Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} className="gamified-badges-row">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <UploadCloud style={{ width: '13px', height: '13px', color: '#67e8f9' }} />
              <span>Upload notes, Earn points</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <Users style={{ width: '13px', height: '13px', color: '#a5b4fc' }} />
              <span>Help other students, Grow together</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <TrendingUp style={{ width: '13px', height: '13px', color: '#c4b5fd' }} />
              <span>Climb the leaderboard, Build your profile</span>
            </div>
          </div>
        </div>

        {/* Right: Gift Box Graphic + Upload Now Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexShrink: 0,
          }}
          className="gamified-cta-right"
        >
          {/* Gift Graphic */}
          <div style={{ fontSize: '52px', lineHeight: 1, position: 'relative', userSelect: 'none' }}>
            🎁
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '16px' }}>✨</span>
            <span style={{ position: 'absolute', top: '-6px', left: '-10px', fontSize: '14px' }}>⭐</span>
            <span style={{ position: 'absolute', bottom: '0px', right: '-12px', fontSize: '11px' }}>✨</span>
          </div>

          {/* Upload Button */}
          <Link
            href="/dashboard/notes/upload"
            style={{
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              padding: '11px 22px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(29, 78, 216, 0.4)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            <span>Upload Now</span>
          </Link>
        </div>
      </div>

      {/* ── Mobile Responsive Styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .gamified-cta-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
            padding: 0 20px !important;
          }
          .gamified-cta-right {
            width: 100% !important;
            justify-content: space-between !important;
          }
        }
      `}</style>
    </section>
  );
}
