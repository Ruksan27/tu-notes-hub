import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      sellerProfile: true,
      projectsListed: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!seller || !seller.sellerProfile) {
    notFound()
  }

  const profile = seller.sellerProfile

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/projects" style={{ color: 'var(--clr-text-3)', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Marketplace
        </Link>
      </div>

      <div className="glass-card" style={{ padding: '36px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
            👨‍💻
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{seller.name}</h1>
              {profile.isVerified && (
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(110,231,183,0.15)', color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(110,231,183,0.3)' }}>
                  ✓ Verified Seller
                </span>
              )}
            </div>
            {profile.college && (
              <p style={{ color: 'var(--clr-text-3)', margin: '4px 0 0', fontSize: '14px' }}>🎓 {profile.college}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--clr-text-3)', marginBottom: '8px' }}>Bio</h3>
            <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, margin: 0, fontSize: '14px' }}>{profile.bio}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {profile.experience && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience</div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{profile.experience}</div>
            </div>
          )}
          {profile.skills && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{profile.skills}</div>
            </div>
          )}
        </div>

        {/* Social Links */}
        {(profile.github || profile.linkedin || profile.youtube) && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🐙 GitHub</a>}
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🔗 LinkedIn</a>}
            {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">▶️ YouTube</a>}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Projects listed by {seller.name}</h2>
      {seller.projectsListed.length === 0 ? (
        <p style={{ color: 'var(--clr-text-3)' }}>No public projects listed yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {seller.projectsListed.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card hover-lift" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{project.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', flex: 1, lineBreak: 'anywhere' }}>{project.shortDescription}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{project.projectType}</span>
                  <span style={{ fontWeight: 700, color: '#6ee7b7' }}>Rs. {project.originalPrice}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
