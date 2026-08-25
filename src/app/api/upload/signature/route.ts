import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { folder } = await req.json()
    if (!folder) {
      return NextResponse.json({ error: 'Folder is required' }, { status: 400 })
    }

    const accountsStr = process.env.CLOUDINARY_ACCOUNTS || '[]'
    let accounts: any[] = []
    try {
      accounts = JSON.parse(accountsStr)
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse cloudinary accounts' }, { status: 500 })
    }

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No cloudinary accounts configured' }, { status: 500 })
    }

    const account = accounts[Math.floor(Math.random() * accounts.length)]

    cloudinary.config({
      cloud_name: account.cloud_name,
      api_key: account.api_key,
      api_secret: account.api_secret,
    })

    const timestamp = Math.round(new Date().getTime() / 1000)

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      account.api_secret
    )

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: account.cloud_name,
      apiKey: account.api_key,
      folder
    })
  } catch (error) {
    console.error('[SIGNATURE ERROR]', error)
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
  }
}
