import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disclaimer | TU Notes Hub',
  description: 'Disclaimer and educational note usage guidelines for TU Notes Hub.',
};

export default function DisclaimerPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #060913 0%, #0a0f1d 100%)',
      color: '#f8fafc',
      paddingTop: '40px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <Link 
          href="/" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            fontSize: '14px',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Back to Home
        </Link>

        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '40px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <ShieldAlert style={{ width: '32px', height: '32px', color: '#67e8f9' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Disclaimer
            </h1>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            Last Updated: September 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#cbd5e1', lineHeight: 1.7, fontSize: '15px' }}>
            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>1. Educational Purpose Only</h2>
              <p>
                TU Notes Hub is an independent student community platform dedicated to sharing academic study materials, previous question papers, handwritten notes, and reference guides. All content is intended strictly for educational and self-study purposes.
              </p>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>2. No Official Affiliation</h2>
              <p>
                TU Notes Hub is NOT officially affiliated with, endorsed by, or operated by Tribhuvan University (TU) or any of its constituent faculties, institutes, or examination boards. All university names, course codes, and trademarks belong to their respective owners.
              </p>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>3. Content Accuracy & AI Predictions</h2>
              <p>
                While we strive for accuracy, study notes and AI-generated exam predictions are for reference only. We do not guarantee 100% accuracy, exam question matches, or passing grades. Students are advised to cross-reference with official university syllabuses and textbooks.
              </p>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>4. Copyright & Takedown</h2>
              <p>
                Materials are uploaded by community members and creators. If you believe any content infringes upon your copyright, please visit our <Link href="/dmca" style={{ color: '#67e8f9', textDecoration: 'underline' }}>DMCA Page</Link> to submit a takedown notice.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
