import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | TU Notes Hub',
  description: 'Get in touch with the TU Notes Hub team for support, inquiries, and feedback.',
}

export default function ContactPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '16px' }}>
          Contact <span className="text-gradient">Us</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '16px', lineHeight: 1.6 }}>
          Have a question about a project? Need help with your account? We're here to assist you.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 700 }}>Get In Touch</h2>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>📧</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Email Support</h3>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '8px' }}>For general inquiries and technical support.</p>
              <a href="mailto:tunoteshub@gmail.com" style={{ color: 'var(--clr-primary-h)', fontWeight: 500, textDecoration: 'none' }}>tunoteshub@gmail.com</a>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>📞</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Phone / WhatsApp</h3>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '8px' }}>For urgent payment or delivery issues.</p>
              <a href="tel:9767776999" style={{ color: 'var(--clr-primary-h)', fontWeight: 500, textDecoration: 'none' }}>9767776999</a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Office Address</h3>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.5 }}>
                Kathmandu, Nepal<br/>
                (We operate primarily online to serve students across all TU affiliated colleges)
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--clr-border)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: 700 }}>Who Are We?</h2>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '15px', lineHeight: 1.7 }}>
            TU Notes Hub is a student-led initiative aiming to centralize academic resources for Tribhuvan University students. We provide a platform for sharing notes, past papers, and a secure marketplace for buying and selling academic projects. Our goal is to make quality education and practical project resources accessible to everyone.
          </p>
        </div>
      </div>
    </div>
  )
}
