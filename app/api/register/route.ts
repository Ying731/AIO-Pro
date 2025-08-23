import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 这个API路由使用服务角色密钥，可以绕过RLS限制
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, role, ...otherData } = body

    console.log('Registration request:', { email, role, fullName })

    // 使用服务角色密钥创建Supabase客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: '服务配置错误：缺少服务角色密钥' }, 
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.some(user => user.email === email)

    let userId: string

    if (userExists) {
      // 如果用户已存在（通过邮箱验证创建），获取用户ID
      const existingUserData = existingUser.users.find(user => user.email === email)
      userId = existingUserData!.id
      console.log('User already exists:', userId)
    } else {
      // 如果用户不存在，创建新用户（邮箱未验证状态）
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // 邮箱未验证，需要用户点击验证链接
        user_metadata: {
          full_name: fullName,
          role,
          ...otherData
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: '用户创建失败：' + authError.message }, 
          { status: 400 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: '用户创建失败：未返回用户数据' }, 
          { status: 400 }
        )
      }

      userId = authData.user.id
      console.log('User created (email not confirmed):', userId)

      // 使用 inviteUserByEmail 发送验证邮件，这个方法更可靠
      const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role,
          ...otherData
        },
        redirectTo: `${process.env.APP_URL || 'http://localhost:3003'}/auth/callback`
      })

      if (emailError) {
        console.error('邮件发送失败:', emailError.message)
        // 删除已创建的用户，因为无法发送验证邮件
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: '发送验证邮件失败：' + emailError.message }, 
          { status: 500 }
        )
      } else {
        console.log('验证邮件已发送到:', email)
      }
    }

    // 重要：不在这里创建任何数据库记录！
    // 所有数据只在邮箱验证成功后创建

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email,
        role
      },
      message: userExists 
        ? '用户档案已更新。' 
        : '注册成功！验证邮件已发送，请检查您的邮箱并点击验证链接后登录。'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: '注册失败：' + String(error) }, 
      { status: 500 }
    )
  }
}