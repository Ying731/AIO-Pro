import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '邮箱地址不能为空' },
        { status: 400 }
      )
    }

    console.log('检查用户状态:', email)

    // 查找这个邮箱的用户
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const user = existingUser.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({
        exists: false,
        verified: false,
        message: '未找到该邮箱的用户'
      })
    }

    const isVerified = !!user.email_confirmed_at
    
    // 检查是否有档案记录
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      exists: true,
      verified: isVerified,
      hasProfile: !!profile,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        confirmedAt: user.email_confirmed_at
      },
      message: isVerified 
        ? '用户已验证，可以直接登录' 
        : '用户存在但邮箱未验证'
    })

  } catch (error) {
    console.error('检查用户状态API错误:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}