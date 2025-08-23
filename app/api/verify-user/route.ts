import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 获取用户ID（从profiles表）
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 更新用户验证状态
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true }
    )

    if (error) {
      console.error('Verification error:', error)
      return NextResponse.json(
        { error: '验证失败：' + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `用户 ${email} 已成功验证`,
      user: data.user
    })

  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { error: '验证失败：' + String(error) },
      { status: 500 }
    )
  }
}