import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blogs & Articles | TU Notes Hub',
  description: 'Read the latest exam tips, guides, and tech articles for TU students.',
}

export const revalidate = 3600 // revalidate every hour

async function getBlogs() {
  return await prisma.blog.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnailUrl: true,
      excerpt: true,
      createdAt: true,
      author: true,
    }
  })
}

export default async function BlogsPage() {
  const blogs = await getBlogs()

  return (
    <main className="container" style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '100vh' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Latest <span className="text-gradient">Articles & Guides</span>
          </h1>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Boost your tech career and ace your TU exams with our expertly crafted guides.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {blogs.map(blog => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform 0.2s', padding: 0 }}>
                {/* Thumbnail */}
                <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#111' }}>
                  {blog.thumbnailUrl ? (
                    <Image src={blog.thumbnailUrl} alt={blog.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-3)' }}>No Image</div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '8px' }}>
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>
                    {blog.title}
                  </h2>
                  
                  <p style={{ fontSize: '14px', color: 'var(--clr-text-2)', lineHeight: 1.6, flex: 1 }}>
                    {blog.excerpt || 'Read this article to learn more...'}
                  </p>
                  
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      {blog.author.charAt(0)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)' }}>{blog.author}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {blogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--clr-text-3)' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
            <p>No blogs published yet. Check back soon!</p>
          </div>
        )}

      </main>
  )
}
