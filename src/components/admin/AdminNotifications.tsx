'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell } from 'lucide-react'

export type Notification = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  isRead: boolean
  createdAt: string
}

export default function AdminNotifications({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (e) {
      console.error('Failed to mark read', e)
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Failed to mark all read', e)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markAsRead(n.id)
    if (n.link) {
      // Map links to tabs
      if (n.link === '/admin?tab=sellers') onNavigate('sellers')
      else if (n.link === '/admin?tab=payments') onNavigate('payments')
      else if (n.link === '/admin?tab=projects') {
         onNavigate('projects')
      }
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropRef} style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .notification-dropdown {
          right: 0;
          width: 320px;
        }
        @media (max-width: 640px) {
          .notification-dropdown {
            right: -60px;
            width: 300px;
            max-width: calc(100vw - 24px);
          }
        }
      `}} />
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          color: 'var(--clr-text-2)',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '999px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="notification-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              background: 'var(--clr-bg-800)',
              border: '1px solid var(--clr-border)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--clr-text-1)' }}>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--clr-text-3)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>🔔</div>
                  <div style={{ fontSize: '13px' }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                      cursor: n.link ? 'pointer' : 'default',
                      display: 'flex',
                      gap: '12px',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => { if (n.link) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseOut={e => { if (n.link) e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99,102,241,0.05)' }}
                  >
                    <div style={{ fontSize: '20px', flexShrink: 0, opacity: n.isRead ? 0.5 : 1 }}>
                      {n.type === 'TESTIMONIAL' && '💬'}
                      {n.type === 'ORDER' && '🛒'}
                      {n.type === 'SELLER_APP' && '📝'}
                      {n.type === 'PAYMENT' && '💳'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: n.isRead ? 500 : 700, color: n.isRead ? 'var(--clr-text-2)' : 'var(--clr-text-1)', marginBottom: '4px' }}>
                        {n.title}
                      </h4>
                      {n.message && (
                        <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.4, marginBottom: '6px' }}>
                          {n.message.length > 80 ? n.message.substring(0, 80) + '...' : n.message}
                        </p>
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', opacity: 0.7 }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
