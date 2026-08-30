'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-toastify'

type CheckoutModalProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  finalPrice: number
}

export default function CheckoutModal({ isOpen, onClose, projectId, projectTitle, finalPrice }: CheckoutModalProps) {
  const [tab, setTab] = useState<'BUY' | 'INQUIRE'>('BUY')
  const [loading, setLoading] = useState(false)

  // Buy Form State
  const [transactionId, setTransactionId] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  // Inquiry Form State
  const [message, setMessage] = useState('')

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'tu-notes-hub') // Ensure this preset exists in Cloudinary

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dcvd8oio1/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setScreenshotUrl(data.secure_url)
        toast.success('Screenshot uploaded!')
      } else {
        toast.error('Failed to upload screenshot')
      }
    } catch {
      toast.error('Upload error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (tab === 'BUY' && (!agreeTerms || !agreePrivacy)) {
      toast.error('You must agree to the Terms of Service and Privacy Policy.')
      return
    }
    setLoading(true)

    const payload = {
      projectId,
      type: tab,
      ...(tab === 'BUY' ? { transactionId, screenshotUrl, amount: finalPrice } : { message })
    }

    try {
      const res = await fetch('/api/projects/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(tab === 'BUY' ? 'Order submitted successfully! Admin will verify soon.' : 'Message sent successfully!')
        onClose()
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white truncate pr-4">{projectTitle}</h2>
              <button onClick={() => { setAgreeTerms(false); setAgreePrivacy(false); onClose(); }} className="text-slate-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setTab('BUY')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'BUY' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Buy Now
              </button>
              <button
                onClick={() => setTab('INQUIRE')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'INQUIRE' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'}`}
              >
                I&apos;m Interested
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {tab === 'BUY' ? (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <p className="text-slate-400 text-sm mb-1">Amount to pay</p>
                    <p className="text-3xl font-bold text-emerald-400">Rs. {finalPrice}</p>
                  </div>

                  <div className="flex justify-center">
                    {/* Placeholder for QR Code, replace with actual path if available */}
                    <div className="w-48 h-48 bg-white p-2 rounded-xl border-4 border-slate-700 relative">
                      <Image src="/qr-placeholder.png" alt="QR Code" fill className="object-contain p-2" />
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-900/10">
                        Scan to Pay
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Transaction ID / Remarks</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="e.g. eSewa ID or bank remark"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Payment Screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 transition-all cursor-pointer"
                      />
                      {uploading && <p className="text-indigo-400 text-xs mt-2 animate-pulse">Uploading...</p>}
                      {screenshotUrl && <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Uploaded successfully</p>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 text-left mb-4">
                    <label className="flex gap-2 items-center cursor-pointer text-sm text-slate-300">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required className="cursor-pointer w-4 h-4" />
                      <span>I Agree to the <Link href="/terms" target="_blank" className="text-indigo-400 underline">Terms of Service</Link></span>
                    </label>
                    <label className="flex gap-2 items-center cursor-pointer text-sm text-slate-300">
                      <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} required className="cursor-pointer w-4 h-4" />
                      <span>I Agree to the <Link href="/privacy" target="_blank" className="text-indigo-400 underline">Privacy Policy</Link></span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Interested in this project but have some questions? Send a message directly to the admin.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      placeholder="e.g. Can we negotiate the price? Does it include setup support?"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/80">
              <button
                onClick={handleSubmit}
                disabled={loading || uploading || (tab === 'BUY' && (!transactionId || !screenshotUrl)) || (tab === 'INQUIRE' && !message)}
                className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                {loading ? 'Submitting...' : tab === 'BUY' ? 'Submit Payment' : 'Send Message'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
