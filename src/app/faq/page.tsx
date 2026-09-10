import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { HelpCircle, ArrowLeft, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | TU Notes Hub',
  description: 'Find answers to common questions about downloading notes, uploading materials, earning points, and membership plans.',
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Is TU Notes Hub free to use?',
      a: 'Yes! Most notes, syllabus guides, and past question papers on TU Notes Hub are completely free to view and download.',
    },
    {
      q: 'How do I earn reward points by uploading notes?',
      a: 'Go to the "Upload Notes" section, submit your handwritten notes or past paper solutions. Once our moderation team approves your submission, you automatically earn +50 points per note.',
    },
    {
      q: 'What can I do with my earned reward points?',
      a: 'Points can be redeemed for Semester Passes, premium AI exam prediction credits, mobile recharge cards, or cash payouts to eSewa/Khalti.',
    },
    {
      q: 'What is included in the Semester Pass / Elite AI plan?',
      a: 'The Semester Pass unlocks ad-free browsing, instant bulk PDF downloads, exclusive AI exam prediction question banks, and priority support.',
    },
    {
      q: 'Are the study notes aligned with the official TU syllabus?',
      a: 'Yes, our materials are curated and tagged specifically according to the latest Tribhuvan University (TU) curriculum for BCA, CSIT, BIT, BBS, BBA, BIM, and BBM.',
    },
    {
      q: 'How can I report an incorrect note or copyright issue?',
      a: 'You can contact us via email at tunoteshub@gmail.com or submit a takedown request through our DMCA page.',
    },
  ];

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
            <HelpCircle style={{ width: '32px', height: '32px', color: '#67e8f9' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Frequently Asked Questions (FAQ)
            </h1>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
            Everything you need to know about TU Notes Hub, downloading materials, and earning rewards.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, margin: '0 0 10px 0' }}>
                  {faq.q}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
