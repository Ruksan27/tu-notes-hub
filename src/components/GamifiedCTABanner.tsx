'use client';

import React from 'react';
import Link from 'next/link';
import { Upload, Users, TrendingUp, UploadCloud } from 'lucide-react';

import TopContributorsWidget from './TopContributorsWidget';

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
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '32px',
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

        {/* Right: Top Contributors Widget + Upload Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexShrink: 0,
          }}
          className="gamified-cta-right"
        >
          {/* Top Contributors Card Widget */}
          <TopContributorsWidget limit={3} />

          {/* Gift Icon & Upload CTA Button */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '42px', lineHeight: 1, position: 'relative', userSelect: 'none' }}>
              🎁
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '14px' }}>✨</span>
              <span style={{ position: 'absolute', top: '-4px', left: '-8px', fontSize: '12px' }}>⭐</span>
            </div>

            <Link
              href="/dashboard/notes/upload"
              style={{
                background: '#1d4ed8',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13.5px',
                padding: '10px 20px',
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
              <Upload style={{ width: '15px', height: '15px' }} />
              <span>Upload Now</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile Responsive Styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .gamified-cta-inner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 32px !important;
            padding: 0 20px !important;
          }
          .gamified-cta-right {
            width: 100% !important;
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
