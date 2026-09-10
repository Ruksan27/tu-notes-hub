'use client';

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname !== '/') {
    return null;
  }

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #070b16 0%, #050811 100%)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      paddingTop: '48px',
      paddingBottom: '20px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>

        {/* ── Main Grid: 3 Columns (Brand, Quick Links, Legal) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '64px',
        }} className="footer-grid">

          {/* Column 1: Brand */}
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '13px',
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              }}>TU</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                Notes<span style={{ color: '#67e8f9' }}>Hub</span>
              </span>
            </Link>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 16px 0', fontStyle: 'italic' }}>
              पढ्नुहोस् · बाँड्नुहोस् · बढ्नुहोस्
            </p>
            <p style={{
              color: '#94a3b8', fontSize: '14px', lineHeight: 1.7,
              margin: '0 0 20px 0', maxWidth: '400px',
            }}>
              An educational platform for Nepali students, learners, and tutors who want to learn, share, and grow together.
            </p>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Mail style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <a href="mailto:tunoteshub@gmail.com" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
                tunoteshub@gmail.com
              </a>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="#" style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s',
              }} aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s',
              }} aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 style={{
              fontSize: '13px', fontWeight: 800, color: '#ffffff',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              margin: '0 0 20px 0',
            }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Home', href: '/' },
                { label: 'Browse Notes', href: '/faculties' },
                { label: 'Upload Notes', href: '/dashboard/notes/upload' },
                { label: 'Pricing & Plans', href: '/pricing' },
                { label: 'About Us', href: '/about' },
                { label: 'Blog', href: '/blogs' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} style={{
                    color: '#94a3b8', fontSize: '14px', textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 style={{
              fontSize: '13px', fontWeight: 800, color: '#ffffff',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              margin: '0 0 20px 0',
            }}>Legal</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Disclaimer', href: '/disclaimer' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'FAQ', href: '/faq' },
                { label: 'DMCA', href: '/dmca' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} style={{
                    color: '#94a3b8', fontSize: '14px', textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div style={{
          marginTop: '36px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            © {new Date().getFullYear()} TU Notes Hub. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Responsive Styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          footer > div {
            padding: 0 20px !important;
          }
        }
      `}</style>
    </footer>
  );
}
