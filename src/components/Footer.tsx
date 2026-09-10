'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Socials {
  facebook: string
  instagram: string
  tiktok: string
  whatsapp: string
}

const DEFAULTS: Socials = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  tiktok: 'https://tiktok.com',
  whatsapp: 'https://wa.me/9800000000',
}

export default function Footer() {
  const pathname = usePathname();
  const [socials, setSocials] = useState<Socials>(DEFAULTS)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.settings) {
          setSocials({
            facebook: data.settings.facebookLink || DEFAULTS.facebook,
            instagram: data.settings.instagramLink || DEFAULTS.instagram,
            tiktok: data.settings.tiktokLink || DEFAULTS.tiktok,
            whatsapp: data.settings.whatsappLink || DEFAULTS.whatsapp,
          })
        }
      })
      .catch(() => {})
  }, [])

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

            {/* Social Icons — real links fetched from site settings */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Facebook */}
              <a
                href={socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Follow us on Facebook"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1877F2', textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Follow us on Instagram"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#E1306C', textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="Follow us on TikTok"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(0,242,254,0.07)', border: '1px solid rgba(0,242,254,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#00F2FE', textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.02-1.9-2.44-3.17-.04 1.25-.01 2.5-.02 3.75-.01 2.9-.01 5.8-.02 8.7 0 1.42-.39 2.82-1.15 4-1.07 1.67-2.9 2.81-4.88 3.07-2.07.28-4.29-.29-5.83-1.74-1.74-1.63-2.58-4.14-2.1-6.52.39-1.96 1.6-3.76 3.39-4.61 1.48-.71 3.23-.8 4.79-.31v4.21c-.87-.31-1.87-.27-2.71.18-.94.5-1.61 1.47-1.73 2.54-.18 1.63.85 3.25 2.48 3.58 1.34.28 2.85-.31 3.42-1.57.26-.58.33-1.22.32-1.85V.02z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat on WhatsApp"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#25D366', textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
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
          <Link href="/about#community" style={{ color: '#475569', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🌐 Follow Us on Social Media →
          </Link>
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
