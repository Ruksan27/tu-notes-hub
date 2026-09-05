import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import nextDynamic from 'next/dynamic'
import AdUnit from '@/components/ads/AdUnit'

// Dynamically import heavy client components to reduce initial JS payload
const AnimatedText = nextDynamic(() => import('@/components/AnimatedText').then(mod => mod.AnimatedText))
const Marquee = nextDynamic(() => import('@/components/Marquee').then(mod => mod.Marquee))
const TestimonialForm = nextDynamic(() => import('@/components/TestimonialForm').then(mod => mod.TestimonialForm))

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TU Notes Hub – Free Notes, Past Papers & AI Exam Predictions for Nepal Students',
  description: 'Download free study notes and past papers for all TU faculties (BCA, CSIT, BIT, BBS, BBA). Get AI-powered exam question predictions.',
}



export default async function HomePage() {
  let faculties: Array<{ id: string; name: string; slug: string; icon: string | null }> = []
  let stats = { notes: 0, students: 0, faculties: 0, papers: 0 }

  let semesterPlanPrice = "Rs. 99"
  let isOffer = false
  let testimonials: any[] = []

  try {
    const [allFacs, notesCount, usersCount, facCount, papersCount, approvedTestimonials] = await Promise.all([
      prisma.faculty.findMany({
        where: { visible: true },
        select: { id: true, name: true, slug: true, icon: true },
      }),
      prisma.note.count(),
      prisma.user.count(),
      prisma.faculty.count({ where: { visible: true } }),
      prisma.pastPaper.count(),
      prisma.testimonial.findMany({ where: { status: 'APPROVED' }, take: 15, orderBy: { createdAt: 'desc' } })
    ])

    const PRIORITY_GROUPS: Record<string, number> = {
      csit: 0, bca: 0, bit: 0, bscit: 0, bim: 0, be: 0,
      bbs: 1, bba: 1, mba: 1,
      bsc: 2, bsag: 2,
      bed: 3, ba: 3,
      llb: 4, mbbs: 4,
    }

    faculties = allFacs
      .map(f => ({ ...f, icon: f.icon || '🎓' }))
      .sort((a, b) => {
        const pa = PRIORITY_GROUPS[a.id.toLowerCase()] ?? 99
        const pb = PRIORITY_GROUPS[b.id.toLowerCase()] ?? 99
        if (pa !== pb) return pa - pb
        return a.name.localeCompare(b.name)
      })
      .slice(0, 8)

    stats = { notes: notesCount, students: usersCount, faculties: facCount, papers: papersCount }
    testimonials = approvedTestimonials
  } catch (error) {
    faculties = []
  }

  try {
    const semPlan = await prisma.pricingPlan.findFirst({ where: { packageType: 'SEMESTER_PASS' } })
    if (semPlan && semPlan.price) {
      semesterPlanPrice = semPlan.price
      if (semPlan.originalPrice && semPlan.discountEndsAt && new Date(semPlan.discountEndsAt) > new Date()) {
        isOffer = true
      } else if (semPlan.originalPrice && !semPlan.discountEndsAt) {
        isOffer = true
      }
    }
  } catch (err) {
    console.error("Failed to load pricing for homepage:", err)
  }

  const dynamicStats = [
    { label: 'Notes & Resources', value: `${stats.notes}+` },
    { label: 'Registered Students', value: `${stats.students}+` },
    { label: 'Faculties Covered', value: `${stats.faculties}` },
    { label: 'Past Papers', value: `${stats.papers}+` },
  ]

  return (
    <>
      {/* ── Hero ─────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 80px' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container text-center" style={{ position: 'relative' }}>
          <div className="badge badge-elite animate-fade-in" style={{ marginBottom: '24px', display: 'inline-flex' }}>
            🚀 Nepal's Trusted TU Academic Platform
          </div>
          <h1 className="animate-fade-in" style={{
            fontSize: 'clamp(36px,6vw,72px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            Ace Your TU Exams with<br />
            <AnimatedText text="AI-Powered Study Tools" className="text-gradient" />
          </h1>
          <p className="animate-fade-in" style={{
            color: 'var(--clr-text-2)',
            fontSize: 'clamp(16px,2vw,20px)',
            maxWidth: '640px',
            margin: '0 auto 40px',
            lineHeight: 1.8,
          }}>
            Access handwritten notes, verified past papers, and AI-driven exam predictions tailored specifically for <strong style={{ color: 'var(--clr-text-1)' }}>Tribhuvan University students</strong>. Say goodbye to scattered PDFs and missing pages!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/faculties" className="btn btn-primary btn-lg">
              📚 Browse Notes Free
            </Link>
            <Link href="/pricing" className="btn btn-outline btn-lg">
              ⚡ View Premium Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────── */}
      <section style={{ padding: '24px 0', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)' }}>
        <div className="container home-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {dynamicStats.map((s) => (
            <div key={s.label} className="text-center" style={{ padding: '8px 4px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px', margin: 0 }}>
                {s.value}
              </p>
              <p style={{ color: 'var(--clr-text-2)', fontSize: 'clamp(11.5px, 3vw, 14px)', marginTop: '4px', fontWeight: 600, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <style>{`
          @media (max-width: 640px) {
            .home-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 16px 12px !important;
            }
          }
        `}</style>
      </section>
 
      {/* ── Faculties Grid ────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
              Browse by <span className="text-gradient">Faculty</span>
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Choose your faculty to access notes and past papers</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
            }}
            className="home-faculties-grid"
          >
            {faculties.length > 0 ? faculties.map((f) => (
              <Link key={f.id} href={`/faculty/${f.slug}`} className="glass-card hover-lift home-fac-card" style={{ padding: '20px 18px', cursor: 'pointer', display: 'block', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{f.icon || '📖'}</div>
                  <h3 style={{ fontSize: '17px', margin: 0, fontWeight: 800 }}>{f.id.toUpperCase()}</h3>
                </div>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '12px', lineHeight: 1.4, margin: 0 }}>{f.name}</p>
              </Link>
            )) : (
              // Placeholder cards while DB is being seeded
              ['BCA 💻', 'CSIT 🖥️', 'BIT 🔧', 'BBS 📊', 'BBA 💼', 'BE ⚙️'].map((f) => (
                <div key={f} className="glass-card home-fac-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{f.split(' ')[1]}</span>
                    <h3 style={{ fontSize: '17px', margin: 0 }}>{f.split(' ')[0]}</h3>
                  </div>
                  <div className="skeleton" style={{ height: '12px', width: '80%' }} />
                </div>
              ))
            )}
          </div>
          
          <div className="text-center" style={{ marginTop: '32px' }}>
            <Link href="/faculties" className="btn btn-outline" style={{ borderRadius: '999px', padding: '10px 24px', fontSize: '13px' }}>
              🔍 View All Faculties →
            </Link>
          </div>

          <style>{`
            @media (max-width: 1100px) {
              .home-faculties-grid { grid-template-columns: repeat(3, 1fr) !important; }
            }
            @media (max-width: 760px) {
              .home-faculties-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
            }
            @media (max-width: 480px) {
              .home-faculties-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
              .home-fac-card { padding: 14px 12px !important; }
            }
          `}</style>

          <div style={{ marginTop: '40px' }}>
            <AdUnit type="inline" slot="home-after-faculties" />
          </div>
        </div>
      </section>

      {/* ── Premium Features ──────────────────────── */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05), transparent)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
              Why Upgrade to <span className="text-gradient">Premium?</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
            {[
              { icon: '🤖', title: 'AI Exam Prediction', desc: 'Compare past papers and get probability-ranked predictions of likely exam questions with AI reasoning.' },
              { icon: '⚡', title: 'Instant Downloads', desc: 'Skip countdown timers and download notes instantly without ads or waiting.' },
              { icon: '📋', title: 'Expert Cheatsheets', desc: 'Admin-curated exam cheatsheets per subject — exactly what you need before the exam.' },
              { icon: '📄', title: 'PDF Export', desc: 'Export AI comparison reports as PDF and study offline anywhere anytime.' },
            ].map((feat) => (
              <div key={feat.title} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              🚀 Upgrade Now — {isOffer ? 'Offer:' : 'Starting'} {semesterPlanPrice} only
            </Link>
          </div>
          
          <div style={{ marginTop: '40px' }}>
            <AdUnit type="leaderboard" slot="home-after-premium" />
          </div>
        </div>
      </section>

      {/* ── Testimonials (Marquee) ────────────────── */}
      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="container" style={{ marginBottom: '40px' }}>
          <div className="text-center">
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
              Loved by <span className="text-gradient">Students</span>
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>See what our users are saying about TU Notes Hub.</p>
          </div>
        </div>

        {/* First Marquee Row */}
        {testimonials.length > 0 ? (
          <div style={{ paddingBottom: '60px' }}>
            <Marquee speed="normal" pauseOnHover={true} className="mb-4">
              {testimonials.map((t) => (
                <div key={t.id} className="glass-card" style={{ width: '320px', padding: '24px', flexShrink: 0, borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                      {t.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{t.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{t.role || 'TU Student'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '12px' }}>
                    {'★'.repeat(t.rating)}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--clr-text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{t.content}"
                  </p>
                </div>
              ))}
            </Marquee>
          </div>
        ) : (
          <div className="text-center" style={{ color: 'var(--clr-text-3)', padding: '40px' }}>
            Be the first to share your experience!
          </div>
        )}

        {/* Submit Review Button */}
        <div style={{ textAlign: 'center' }}>
          <TestimonialForm />
        </div>
      </section>

      {/* ── Dynamic FAQ Accordion Section (Rich Snippets SEO) ────────────────── */}
      <section className="section" style={{ borderTop: '1px solid var(--clr-border)', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Clear your doubts about TU notes, syllabus & exam models</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: "How can I access TU exam notes and syllabus?",
                a: "You can browse notes by choosing your Faculty (such as BCA, CSIT, BE, BBS, etc.) directly from the homepage. Select your Semester or Year to view specific subject materials."
              },
              {
                q: "Are the notes and past papers on this website free?",
                a: "Yes! All standard notes, past question papers, and official syllabus copies are 100% free to view and download for all TU students."
              },
              {
                q: "What is the AI Exam Prediction feature?",
                a: "The AI Exam Predictor analyzes past 5 years of exam questions, syllabus models, and weightages. Using TU Notes Elite AI, it calculates probability patterns to highlight topics highly likely to appear in upcoming exams."
              },
              {
                q: "How does the Elite Pass membership work?",
                a: "The Elite Pass gives you access to premium cheatsheets, instant download links (skipping ad screens/timers), dynamic PDF exports of AI forecasts, and offline preview options."
              },
              {
                q: "Can I request notes that are missing on the platform?",
                a: "Absolutely! You can use the 'Request a Note' feature or submit your own handwritten notes to help fellow university students."
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="glass-card"
                style={{
                  padding: '18px 24px',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: '1px solid var(--clr-border)'
                }}
              >
                <summary style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--clr-text-1)',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--clr-primary-h)', fontSize: '20px' }}>+</span>
                </summary>
                <p style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: 'var(--clr-text-2)',
                  lineHeight: '1.6',
                  cursor: 'default'
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* FAQ Schema Markup JSON-LD for Google Rich Snippets */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How can I access TU exam notes and syllabus?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "You can browse notes by choosing your Faculty (such as BCA, CSIT, BE, BBS, etc.) directly from the homepage. Select your Semester or Year to view specific subject materials."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Are the notes and past papers on this website free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes! All standard notes, past question papers, and official syllabus copies are 100% free to view and download for all TU students."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What is the AI Exam Prediction feature?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The AI Exam Predictor analyzes past 5 years of exam questions, syllabus models, and weightages. Using TU Notes Elite AI, it calculates probability patterns to highlight topics highly likely to appear in upcoming exams."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does the Elite Pass membership work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The Elite Pass gives you access to premium cheatsheets, instant download links (skipping ad screens/timers), dynamic PDF exports of AI forecasts, and offline preview options."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I request notes that are missing on the platform?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Absolutely! You can use the 'Request a Note' feature or submit your own handwritten notes to help fellow university students."
                    }
                  }
                ]
              })
            }}
          />
        </div>
      </section>
    </>
  )
}
