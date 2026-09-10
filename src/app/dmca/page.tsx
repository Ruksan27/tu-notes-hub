import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA Copyright Policy & Takedown | TU Notes Hub',
  description: 'DMCA Copyright Compliance and Content Takedown Policy for TU Notes Hub.',
};

export default function DMCAPage() {
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
            <ShieldCheck style={{ width: '32px', height: '32px', color: '#67e8f9' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              DMCA Copyright Policy
            </h1>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            TU Notes Hub respects the intellectual property rights of authors, publishers, and content creators.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#cbd5e1', lineHeight: 1.7, fontSize: '15px' }}>
            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Digital Millennium Copyright Act (DMCA) Compliance</h2>
              <p>
                As a user-contributed academic platform, study materials are uploaded directly by students, teachers, and independent contributors. If you believe your copyrighted work has been copied or uploaded without permission, we will take immediate action to remove or disable access to the material.
              </p>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Submitting a Takedown Request</h2>
              <p>
                To request content removal, please send an email to <strong style={{ color: '#67e8f9' }}>tunoteshub@gmail.com</strong> with the following information:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Your full name and contact information (Email and Phone number).</li>
                <li>Exact URL(s) of the material(s) on TU Notes Hub that you wish to be removed.</li>
                <li>Proof or description of the copyrighted work you claim has been infringed.</li>
                <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Processing Time</h2>
              <p>
                Valid takedown requests are processed within <strong>24 to 48 hours</strong> of receipt. Once verified, the material will be permanently removed from our servers.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
