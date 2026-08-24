import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const project = await prisma.projectItem.findUnique({
    where: { id },
    include: {
      user: {
        include: { sellerProfile: true }
      }
    }
  })

  if (!project || (project.status !== 'ACTIVE' && project.status !== 'PENDING')) {
    notFound()
  }

  const finalPrice = Math.floor(project.originalPrice * (1 - project.discountPercentage / 100))
  
  const screenshots = [project.screenshot1, project.screenshot2, project.screenshot3, project.screenshot4].filter(Boolean)

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: Details */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              {project.category} {project.subcategory ? ` / ${project.subcategory}` : ''}
            </span>
            <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '8px 0', lineHeight: 1.2 }}>{project.title}</h1>
            <p style={{ fontSize: '18px', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>{project.shortDescription}</p>
          </div>

          {/* Image Gallery */}
          {project.thumbnailUrl && (
            <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Image src={project.thumbnailUrl} alt={project.title} fill style={{ objectFit: 'cover' }} />
            </div>
          )}
          
          {screenshots.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
              {screenshots.map((src, i) => (
                <div key={i} style={{ width: '200px', height: '120px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Image src={src!} alt={`Screenshot ${i+1}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Tabs / Content */}
          <div className="glass-card" style={{ padding: '32px', marginTop: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--clr-primary-h)' }}>Project Details</h3>
            <div style={{ color: 'var(--clr-text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '32px' }}>
              {project.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Features</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(project.features || '').split('\n').map((f, i) => f.trim() && (
                    <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)' }}>
                      <span style={{ color: '#6ee7b7' }}>✓</span> {f.replace(/^✓\s*/, '')}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>Modules</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(project.modules || '').split('\n').map((m, i) => m.trim() && (
                    <li key={i} style={{ display: 'flex', gap: '8px', color: 'var(--clr-text-2)' }}>
                      <span style={{ color: '#a5b4fc' }}>●</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Tech Stack */}
          <div className="glass-card" style={{ padding: '32px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--clr-primary-h)' }}>Technology Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.technologies.split(',').map(t => t.trim()).map(t => t && (
                <span key={t} style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '999px', fontSize: '13px', color: '#c7d2fe', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '24px' }}>
              {project.frontend && <div><div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Frontend</div><div style={{ fontWeight: 600 }}>{project.frontend}</div></div>}
              {project.backend && <div><div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Backend</div><div style={{ fontWeight: 600 }}>{project.backend}</div></div>}
              {project.dbType && <div><div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Database</div><div style={{ fontWeight: 600 }}>{project.dbType}</div></div>}
            </div>
          </div>
        </div>
        
        {/* Right Column: Sticky Sidebar */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                {project.discountPercentage > 0 && <div style={{ fontSize: '14px', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>Rs. {project.originalPrice}</div>}
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#6ee7b7', lineHeight: 1 }}>Rs. {finalPrice}</div>
              </div>
              {project.negotiable && <span style={{ fontSize: '12px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--clr-text-2)' }}>Negotiable</span>}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px', marginBottom: '12px' }}>
              Buy Now
            </button>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px' }}>
              Chat with Seller
            </button>

            <div style={{ margin: '24px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-text-3)' }}>License</span>
                <span style={{ fontWeight: 600 }}>{project.license || 'Standard'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-text-3)' }}>Sales Type</span>
                <span style={{ fontWeight: 600 }}>{project.salesType || 'Non-Exclusive'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-text-3)' }}>Project Type</span>
                <span style={{ fontWeight: 600 }}>{project.projectType || 'Software'}</span>
              </div>
            </div>

            <div style={{ margin: '24px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Developer Info */}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '8px' }}>Developer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  👨‍💻
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {project.sellerId ? project.user?.name : 'TU Notes Admin'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--clr-text-2)' }}>
                    {project.sellerId && project.user?.sellerProfile?.isVerified ? '✓ Verified Seller' : 'Platform Publisher'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Demo Links */}
            {(project.demoUrl || project.youtubeUrl || project.githubUrl) && (
              <>
                <div style={{ margin: '24px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>🌐 Live Demo</a>}
                  {project.youtubeUrl && <a href={project.youtubeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.2)' }}>▶️ YouTube Video</a>}
                  {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>🐙 GitHub (Request Access)</a>}
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
