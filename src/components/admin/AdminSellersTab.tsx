'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'

interface SellerProfile {
  id: string
  user: { id: string, name: string, email: string }
  college: string | null
  bio: string | null
  experience: string | null
  skills: string | null
  status: string
  github: string | null
  linkedin: string | null
  createdAt: string
}

export default function AdminSellersTab() {
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sellers')
      if (res.ok) {
        const data = await res.json()
        setSellers(data.sellers || [])
      }
    } catch {
      toast.error('Failed to load sellers')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(sellerId: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Seller ${status.toLowerCase()}!`)
        fetchData()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const pendingSellers = sellers.filter(s => s.status === 'PENDING')
  const otherSellers = sellers.filter(s => s.status !== 'PENDING')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 className="text-3xl font-bold mb-2">🛍️ Seller Applications</h2>
          <p style={{ color: 'var(--clr-text-2)' }}>Review and verify student seller profiles.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Pending Applications */}
        <div>
          <h3 className="section-title">⏳ Pending Review ({pendingSellers.length})</h3>
          {pendingSellers.length === 0 ? (
             <div className="glass-card text-center" style={{ padding: '32px' }}>
               <p style={{ color: 'var(--clr-text-3)' }}>No pending seller applications.</p>
             </div>
          ) : (
             <div className="grid-auto">
               {pendingSellers.map(seller => (
                 <SellerCard key={seller.id} seller={seller} onUpdate={updateStatus} />
               ))}
             </div>
          )}
        </div>

        {/* Verified / Rejected */}
        <div>
          <h3 className="section-title">Verified Sellers ({otherSellers.length})</h3>
          {otherSellers.length === 0 ? (
             <div className="glass-card text-center" style={{ padding: '32px' }}>
               <p style={{ color: 'var(--clr-text-3)' }}>No verified sellers yet.</p>
             </div>
          ) : (
             <div className="table-wrap">
               <table>
                 <thead>
                   <tr>
                     <th>User</th>
                     <th>College</th>
                     <th>Skills</th>
                     <th>Status</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {otherSellers.map(seller => (
                     <tr key={seller.id}>
                       <td>
                         <div style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>{seller.user.name}</div>
                         <div style={{ fontSize: '12px' }}>{seller.user.email}</div>
                       </td>
                       <td>{seller.college}</td>
                       <td><div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.skills}</div></td>
                       <td>
                         <span className={`badge ${seller.status === 'APPROVED' ? 'badge-strong' : 'badge-low'}`}>
                           {seller.status}
                         </span>
                       </td>
                       <td>
                         {seller.status === 'APPROVED' ? (
                           <button className="btn btn-sm btn-danger" onClick={() => updateStatus(seller.id, 'REJECTED')}>Revoke</button>
                         ) : (
                           <button className="btn btn-sm btn-primary" onClick={() => updateStatus(seller.id, 'APPROVED')}>Approve</button>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SellerCard({ seller, onUpdate }: { seller: SellerProfile, onUpdate: (id: string, st: 'APPROVED'|'REJECTED') => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h4 className="text-lg font-bold" style={{ color: 'var(--clr-primary-h)' }}>{seller.user.name}</h4>
        <p style={{ fontSize: '12px', color: 'var(--clr-text-2)' }}>{seller.user.email}</p>
      </div>
      
      <div style={{ fontSize: '13px', color: 'var(--clr-text-1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p><strong>College:</strong> {seller.college}</p>
        <p><strong>Experience:</strong> {seller.experience}</p>
        <p><strong>Skills:</strong> {seller.skills}</p>
        <div>
          <strong>Bio:</strong>
          <p style={{ color: 'var(--clr-text-2)', marginTop: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
            {seller.bio}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {seller.github && <a href={seller.github} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-accent-h)', textDecoration: 'underline' }}>GitHub</a>}
          {seller.linkedin && <a href={seller.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-accent-h)', textDecoration: 'underline' }}>LinkedIn</a>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onUpdate(seller.id, 'APPROVED')}>
          ✅ Approve
        </button>
        <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onUpdate(seller.id, 'REJECTED')}>
          ❌ Reject
        </button>
      </div>
    </motion.div>
  )
}
