// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendOTPEmail(email: string, otp: string, type: 'REGISTER' | 'FORGOT_PASSWORD') {
  const subject = type === 'REGISTER' ? 'Verify Your TU Notes Hub Account' : 'Reset Your Password - TU Notes Hub'
  const title = type === 'REGISTER' ? 'Email Verification' : 'Password Reset'
  const message = type === 'REGISTER'
    ? 'Use the OTP below to verify your email address and activate your TU Notes Hub account.'
    : 'Use the OTP below to reset your password. This code expires in 10 minutes.'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#0d0f1a;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:linear-gradient(135deg,#1a1d2e,#151826);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">📚 TU Notes Hub</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your Academic Success Partner</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">${title}</h2>
          <p style="color:#94a3b8;line-height:1.6;margin:0 0 32px;">${message}</p>
          <div style="background:rgba(99,102,241,0.1);border:2px dashed rgba(99,102,241,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
            <p style="color:#a5b4fc;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;">${otp}</p>
            <p style="color:#64748b;margin:12px 0 0;font-size:12px;">Valid for 10 minutes only</p>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">If you didn't request this, ignore this email.</p>
        </div>
        <div style="border-top:1px solid rgba(99,102,241,0.2);padding:20px 32px;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">© 2025 TU Notes Hub. For Tribhuvan University Students.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  })
}

export async function sendPaymentApprovalEmail(email: string, userName: string, packageBought: string, expiresAt: Date | null) {
  const subject = 'Your Payment is Approved! - TU Notes Hub'
  const title = 'Payment Approved & Subscription Active'
  
  const expiryText = expiresAt 
    ? `Your <strong>${packageBought}</strong> subscription is now active until <strong>${expiresAt.toLocaleDateString()}</strong>.`
    : `Your <strong>${packageBought}</strong> subscription is now active.`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#0d0f1a;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:linear-gradient(135deg,#1a1d2e,#151826);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎉 Payment Approved!</h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">Hello, ${userName}!</h2>
          <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">Thank you for your purchase. We have verified your payment and updated your account.</p>
          <div style="background:rgba(16,185,129,0.1);border:2px dashed rgba(16,185,129,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:14px;">${expiryText}</p>
          </div>
          <p style="color:#64748b;font-size:14px;text-align:center;margin:0;">You can now log in and enjoy premium access!</p>
        </div>
        <div style="border-top:1px solid rgba(99,102,241,0.2);padding:20px 32px;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">© 2025 TU Notes Hub. For Tribhuvan University Students.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  })
}

export async function sendSellerStatusEmail(
  email: string,
  userName: string,
  status: 'APPROVED' | 'REJECTED'
) {
  const isApproved = status === 'APPROVED'
  const subject = isApproved
    ? '🎉 Congratulations! You are now a Verified Seller — TU Notes Hub'
    : 'Seller Application Update — TU Notes Hub'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#0d0f1a;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1d2e,#151826);border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;">
        
        <!-- Header -->
        <div style="background:${isApproved ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'linear-gradient(135deg,#374151,#1f2937)'};padding:36px;text-align:center;">
          <div style="font-size:52px;margin-bottom:12px;">${isApproved ? '🛍️' : '📋'}</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">
            ${isApproved ? 'Seller Account Activated!' : 'Application Status Update'}
          </h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">TU Notes Hub — Seller Program</p>
        </div>

        <!-- Body -->
        <div style="padding:40px 36px;">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;">Hello, ${userName}! 👋</h2>
          
          ${isApproved ? `
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 28px;">
            We have reviewed your seller application and are thrilled to let you know that your account has been <strong style="color:#6ee7b7;">approved</strong>! You can now log in and access your <strong>Seller Center</strong> to start uploading your projects.
          </p>

          <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:24px;margin-bottom:28px;">
            <p style="color:#a5b4fc;font-weight:700;margin:0 0 12px;font-size:15px;">✅ What's next?</p>
            <ul style="color:#94a3b8;margin:0;padding-left:20px;line-height:1.9;font-size:14px;">
              <li>Log in to your dashboard and open <strong>Seller Center</strong></li>
              <li>Upload your first project with screenshots & description</li>
              <li>Set your price — Admin will review and approve it</li>
              <li>Buyers will contact Admin via WhatsApp for purchase</li>
              <li>After payment, Admin delivers the source code to buyer</li>
            </ul>
          </div>

          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <p style="color:#fcd34d;margin:0;font-size:13px;"><strong>⚠️ Reminder:</strong> Keep your project source code repository <strong>PRIVATE</strong>. All sales must go through TU Notes platform only.</p>
          </div>

          <div style="text-align:center;">
            <a href="https://tunoteshub.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#06b6d4);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Go to Seller Center →
            </a>
          </div>
          ` : `
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">
            Thank you for applying to become a seller on TU Notes Hub. After reviewing your application, we are unable to approve your seller account at this time.
          </p>
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="color:#fca5a5;margin:0;font-size:14px;line-height:1.7;">
              This could be due to incomplete information or eligibility requirements not being met. You are welcome to update your profile details and re-apply from your dashboard.
            </p>
          </div>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            If you have questions, please contact us via WhatsApp. We appreciate your interest in joining our seller community!
          </p>
          `}
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid rgba(99,102,241,0.15);padding:20px 36px;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">© 2025 TU Notes Hub — For Tribhuvan University Students</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  })
}
