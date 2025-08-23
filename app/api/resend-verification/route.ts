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

    console.log('重新发送验证邮件给:', email)

    // 查找这个邮箱的用户
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const user = existingUser.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: '未找到该邮箱的用户，请先注册' },
        { status: 404 }
      )
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { 
          error: '该邮箱已经验证过了，可以直接登录',
          alreadyVerified: true,
          user: {
            id: user.id,
            email: user.email,
            confirmedAt: user.email_confirmed_at
          }
        },
        { status: 400 }
      )
    }

    // 重新发送邀请邮件
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: user.user_metadata || {},
      redirectTo: `${process.env.APP_URL || 'http://localhost:3003'}/auth/callback`
    })

    if (emailError) {
      console.error('重新发送邮件失败:', emailError.message)
      return NextResponse.json(
        { error: '发送邮件失败: ' + emailError.message },
        { status: 500 }
      )
    }

    console.log('验证邮件已重新发送给:', email)
    
    return NextResponse.json({
      success: true,
      message: '验证邮件已重新发送'
    })

  } catch (error) {
    console.error('重新发送验证邮件API错误:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}