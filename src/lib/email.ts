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
