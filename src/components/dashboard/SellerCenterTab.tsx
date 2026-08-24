'use client'

import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  sellerProfile?: any
}

export default function SellerCenterTab({ user }: { user: User }) {
  const router = useRouter()

  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="section-title" style={{ margin: 0 }}>🏬 Seller Center</h3>
      </div>
      
      {user.sellerProfile?.status === 'PENDING' ? (
        <div style={{ textAlign: 'center', padding: '64px' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>⏳</div>
          <h4 className="text-2xl font-bold mb-3">Application Under Review</h4>
          <p style={{ color: 'var(--clr-text-2)', maxWidth: '400px', margin: '0 auto' }}>
            Your seller profile is currently being reviewed by our admins. You will receive an email once your account is verified and approved for selling.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <p style={{ color: 'var(--clr-text-2)', fontSize: '15px' }}>
              Welcome back, <strong>{user.name.split(' ')[0]}</strong>! Manage your projects and earnings here.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span>💬</span> Chat with Admin
               </button>
               <button className="btn btn-primary" onClick={() => router.push('/dashboard/seller/upload')}>
                 ➕ Upload New Project
               </button>
            </div>
          </div>
          
          <h4 className="text-lg font-bold mb-4">My Projects</h4>
          {/* TODO: Fetch and list seller's projects */}
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--clr-border)' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📁</span>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>No projects uploaded yet.</p>
          </div>
        </div>
      )}
    </div>
  )
}
