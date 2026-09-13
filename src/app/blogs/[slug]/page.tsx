import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SocialShare from '@/components/SocialShare'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AdUnit from '@/components/ads/AdUnit'

export const revalidate = 3600 // 1 hour

type Props = {
  params: Promise<{ slug: string }>
}

async function getBlog(rawSlug: string) {
  const decoded = decodeURIComponent(rawSlug).trim()
  const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  const unslugified = decoded.replace(/-/g, ' ')

  let blog = await prisma.blog.findFirst({
    where: {
      OR: [
        { slug: rawSlug },
        { slug: decoded },
        { slug: slugified },
        { slug: unslugified },
        { title: decoded },
        { title: unslugified },
        { id: rawSlug },
        { id: decoded },
      ]
    }
  })

  if (!blog) {
    blog = await prisma.blog.findFirst({
      where: {
        OR: [
          { slug: { contains: slugified } },
          { title: { contains: decoded } }
        ]
      }
    })
  }

  return blog
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) return { title: 'Blog Not Found | TU Notes Hub' }

  return {
    title: `${blog.metaTitle || blog.title} | TU Notes Hub`,
    description: blog.metaDesc || blog.excerpt || '',
    keywords: blog.keywords || '',
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDesc || blog.excerpt || '',
      url: `https://tunoteshub.me/blogs/${blog.slug}`,
      images: [{ url: blog.thumbnailUrl || '/default-og.png' }],
      type: 'article',
      publishedTime: blog.createdAt.toISOString(),
      authors: [blog.author],
    },
    alternates: {
      canonical: `https://tunoteshub.me/blogs/${blog.slug}`,
    }
  }
}

function extractToc(html: string) {
  const headings: { id: string, text: string, level: number }[] = []
  const regex = /<(h[23])[^>]*>(.*?)<\/\1>/gi
  let match
  let index = 0
  let modifiedHtml = html

  while ((match = regex.exec(html)) !== null) {
    const level = match[1] === 'h2' ? 2 : 3
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${index}`
    headings.push({ id, text, level })
    
    const replacement = match[0].replace(/<(h[23])/, `<$1 id="${id}"`)
    modifiedHtml = modifiedHtml.replace(match[0], replacement)
    index++
  }

  return { headings, modifiedHtml }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) {
    notFound()
  }

  const textContent = blog.content.replace(/<[^>]*>?/gm, '')
  const wordCount = textContent.split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const { headings, modifiedHtml } = extractToc(blog.content)

  const keywordsArr = blog.keywords?.split(',').map(k => k.trim()).filter(Boolean) || []
  let relatedBlogs: any[] = []
  if (keywordsArr.length > 0) {
    relatedBlogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
        id: { not: blog.id },
        OR: keywordsArr.map(k => ({ keywords: { contains: k } }))
      },
      take: 3,
      orderBy: { views: 'desc' }
    })
  }
  if (relatedBlogs.length === 0) {
    relatedBlogs = await prisma.blog.findMany({
      where: { isPublished: true, id: { not: blog.id } },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: blog.title,
    description: blog.excerpt || blog.metaDesc,
    image: blog.thumbnailUrl,
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: blog.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TU Notes Hub',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tunoteshub.me/logo.png'
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container pt-3 sm:pt-20 pb-12 sm:pb-20 min-h-screen max-w-[1000px] mx-auto px-4">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--clr-text-3)' }}>
            <li><Link href="/" style={{ color: 'var(--clr-text-3)', textDecoration: 'none' }}>Home</Link></li>
            <li>/</li>
            <li><Link href="/blogs" style={{ color: 'var(--clr-text-3)', textDecoration: 'none' }}>Blogs</Link></li>
            <li>/</li>
            <li style={{ color: 'var(--clr-text-2)', fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} aria-current="page">
              {blog.title}
            </li>
          </ol>
        </nav>

        {/* ── Ad 1: Top Horizontal Leaderboard Ad Banner ── */}
        <div style={{ marginBottom: '24px' }}>
          <AdUnit type="leaderboard" slot="blog-detail-top-banner" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px', alignItems: 'start' }} className="blog-page-grid">
          
          <article style={{ minWidth: 0 }}>
            <header style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px', color: 'var(--clr-text-1)' }}>
                {blog.title}
              </h1>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', color: 'var(--clr-text-3)', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    {blog.author.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--clr-text-2)' }}>{blog.author}</span>
                </div>
                <span style={{ opacity: 0.5 }}>•</span>
                <time dateTime={blog.createdAt.toISOString()}>
                  {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
              </div>
            </header>

            {blog.thumbnailUrl && (blog.thumbnailUrl.startsWith('/') || blog.thumbnailUrl.startsWith('http://') || blog.thumbnailUrl.startsWith('https://')) && (
              <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Image src={blog.thumbnailUrl} alt={blog.title} fill style={{ objectFit: 'cover' }} priority unoptimized={!blog.thumbnailUrl.startsWith('/') && !blog.thumbnailUrl.includes('cloudinary.com')} />
              </div>
            )}

            {/* ── Ad 2: In-Article Horizontal Banner Ad ── */}
            <div style={{ margin: '20px 0 28px 0' }}>
              <AdUnit type="inline" slot="blog-detail-in-article-banner" />
            </div>

            {/* Render Rich HTML Content */}
            <div 
              className="blog-content prose prose-invert max-w-none" 
              style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--clr-text-2)' }}
              dangerouslySetInnerHTML={{ __html: modifiedHtml }} 
            />

            {/* ── Ad 3: End of Article Medium Rectangle / Square Ad Unit ── */}
            <div style={{ marginTop: '36px', marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
              <AdUnit type="medium-rectangle" slot="blog-detail-content-bottom-square" />
            </div>

            {/* Social Share Buttons */}
            <SocialShare title={blog.title} text={blog.excerpt || ''} slug={blog.slug} />

            {/* Attached PDF Download */}
            {blog.fileUrl && (blog.fileUrl.startsWith('http://') || blog.fileUrl.startsWith('https://') || blog.fileUrl.startsWith('/')) && (
              <div style={{ marginTop: '32px', padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(6,182,212,0.05))', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '4px' }}>Download Attached Notes</h4>
                  <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', margin: 0 }}>This PDF is safely watermarked with TU Notes Hub logo.</p>
                </div>
                <a 
                  href={`/api/download-watermarked?blogId=${blog.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontWeight: 700 }}
                >
                  📥 Download PDF
                </a>
              </div>
            )}

          </article>

          {/* Sticky Sidebar: Table of Contents + Ad 4 (Sidebar Square Ad) */}
          <aside style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {headings.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--clr-text-1)', marginBottom: '16px' }}>
                  Table of Contents
                </h4>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {headings.map(h => (
                    <a 
                      key={h.id} 
                      href={`#${h.id}`} 
                      style={{ 
                        fontSize: '13px', 
                        color: 'var(--clr-text-3)', 
                        textDecoration: 'none', 
                        marginLeft: h.level === 3 ? '16px' : '0',
                        lineHeight: 1.4,
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--clr-text-3)'}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* ── Ad 4: Sidebar Medium-Rectangle / Square Ad ── */}
            <div>
              <AdUnit type="medium-rectangle" slot="blog-detail-sidebar-square-ad" />
            </div>
          </aside>

        </div>

        {/* Related Articles Section */}
        {relatedBlogs.length > 0 && (
          <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--clr-text-1)', marginBottom: '24px' }}>
              Related Articles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {relatedBlogs.map(rb => (
                <Link key={rb.id} href={`/blogs/${rb.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="glass-card" style={{ padding: '16px', transition: 'transform 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4, color: 'var(--clr-text-1)' }}>{rb.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', flex: 1 }}>{rb.excerpt?.substring(0, 80)}...</p>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700, marginTop: '12px' }}>Read More →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .blog-page-grid {
              grid-template-columns: 1fr !important;
            }
          }
          .blog-content h2 { font-size: 26px; font-weight: 800; color: #fff; margin-top: 48px; margin-bottom: 20px; scroll-margin-top: 90px; }
          .blog-content h3 { font-size: 20px; font-weight: 700; color: #e2e8f0; margin-top: 32px; margin-bottom: 16px; scroll-margin-top: 90px; }
          .blog-content p { margin-bottom: 20px; }
          .blog-content ul { padding-left: 24px; margin-bottom: 20px; list-style-type: disc; }
          .blog-content li { margin-bottom: 10px; }
          .blog-content a { color: #818cf8; text-decoration: underline; }
          .blog-content blockquote { border-left: 4px solid #6366f1; padding-left: 20px; font-style: italic; color: #94a3b8; background: rgba(99,102,241,0.05); padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
          .blog-content pre { background: #0f172a; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; border: 1px solid rgba(255,255,255,0.05); }
          .blog-content code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 14px; }
          .blog-content img { max-width: 100%; border-radius: 12px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.05); }
          
          .blog-content .pdf-cta-box {
            display: flex; align-items: center; justify-content: space-between;
            background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1));
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 12px; padding: 20px; margin: 32px 0;
            flex-wrap: wrap; gap: 16px;
          }
          .blog-content .pdf-cta-box .cta-text { font-size: 15px; font-weight: 700; color: #fff; margin: 0; }
          .blog-content .pdf-cta-box .cta-btn {
            background: linear-gradient(135deg, #6366f1, #06b6d4);
            color: #fff; text-decoration: none; padding: 10px 20px;
            border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;
          }
        `}} />

      </main>
    </>
  )
}
