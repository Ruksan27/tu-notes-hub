import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Project Marketplace — Buy BCA, CSIT & IT Projects | TU Notes Hub',
  description:
    'Browse and buy verified BCA, CSIT, BIT, and IT student projects with full source code, database, documentation, and setup guides. Nepal\'s #1 student project marketplace.',
  keywords: [
    'buy student project Nepal',
    'BCA project source code',
    'CSIT project Nepal',
    'IT project Nepal',
    'student project marketplace',
    'TU project Nepal',
    'MERN stack project Nepal',
    'PHP project Nepal',
    'React project Nepal',
    'project with source code Nepal',
  ],
  alternates: {
    canonical: 'https://tunoteshub.com/projects',
  },
  openGraph: {
    type: 'website',
    url: 'https://tunoteshub.com/projects',
    title: 'Student Project Marketplace | TU Notes Hub',
    description: 'Buy verified BCA, CSIT & IT projects with source code, docs, and database. Fast delivery to your email.',
    siteName: 'TU Notes Hub',
    images: [{ url: 'https://tunoteshub.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Project Marketplace | TU Notes Hub',
    description: 'Buy verified student projects with full source code for BCA, CSIT & IT.',
    images: ['https://tunoteshub.com/og-image.png'],
    site: '@tunoteshub',
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
