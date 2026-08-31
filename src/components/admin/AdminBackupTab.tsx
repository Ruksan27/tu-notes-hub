'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'

type BackupTable = {
  id: string
  name: string
  description: string
  icon: string
}

export default function AdminBackupTab() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const backupTables: BackupTable[] = [
    { id: 'user', name: 'Users & Subscriptions', description: 'Student records, credentials metadata, and plan information.', icon: '👥' },
    { id: 'note', name: 'Study Notes & Materials', description: 'Meta details, descriptions, file sizes, and URLs of notes.', icon: '📚' },
    { id: 'pastPaper', name: 'Past Question Papers', description: 'Years, exam types, and subject mappings for past papers.', icon: '📝' },
    { id: 'projectItem', name: 'Projects Marketplace', description: 'Available coding projects, pricing, and seller mapping.', icon: '💻' },
    { id: 'projectOrder', name: 'Project Orders', description: 'Sales transactions and details of purchased projects.', icon: '🛒' },
    { id: 'payment', name: 'Premium Payments', description: 'Verify payment orders, amounts, transaction IDs, and statuses.', icon: '💳' },
    { id: 'sellerProfile', name: 'Seller Applications', description: 'Developer accounts, colleges, bios, and verification statuses.', icon: '🛍️' },
    { id: 'faculty', name: 'Faculties & Systems', description: 'TU faculties, semesters, and system types configured.', icon: '🏫' },
    { id: 'subject', name: 'Faculty Subjects', description: 'Subjects mapped under faculties and semesters.', icon: '📖' },
  ]

  const handleDownload = async (tableId: string, name: string) => {
    setDownloading(tableId)
    try {
      const response = await fetch(`/api/admin/backup?table=${tableId}`)
      if (!response.ok) {
        throw new Error('Failed to retrieve backup data')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${tableId}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success(`${name} CSV downloaded successfully! 💾`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to download backup')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.06))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '16px'
        }}
      >
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-primary-h)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          🛡️ Database Security & Portability
        </h4>
        <p style={{ fontSize: '13.5px', color: 'var(--clr-text-2)', lineHeight: 1.6, margin: 0 }}>
          Export your live database records from TiDB Serverless to CSV format. 
          It is highly recommended to download these backups **once a week** to maintain a local archive. 
          If you ever need to migrate to a different database provider, these files will help you restore all data seamlessly.
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Icon</th>
              <th>Table Name</th>
              <th>Description</th>
              <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backupTables.map((t) => (
              <tr key={t.id}>
                <td style={{ fontSize: '20px', padding: '16px 18px' }}>{t.icon}</td>
                <td style={{ fontWeight: 700, color: 'var(--clr-text-1)', fontSize: '14px' }}>{t.name}</td>
                <td style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>{t.description}</td>
                <td style={{ textAlign: 'right', padding: '16px 18px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={downloading !== null}
                    onClick={() => handleDownload(t.id, t.name)}
                    style={{ 
                      borderColor: 'rgba(99,102,241,0.3)',
                      color: 'var(--clr-primary-h)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {downloading === t.id ? '📥 Downloading...' : '💾 Export CSV'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
