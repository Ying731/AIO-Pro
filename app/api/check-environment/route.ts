import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      COMPUTED_CALLBACK_URL: process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/auth/callback` 
        : `${process.env.APP_URL || 'http://localhost:3003'}/auth/callback`
    }

    return NextResponse.json(envInfo)
  } catch (error) {
    return NextResponse.json(
      { error: '环境检查失败：' + String(error) }, 
      { status: 500 }
    )
  }
}