import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 尝试登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json(
        { error: '登录失败：' + authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '登录失败：未返回用户数据' },
        { status: 401 }
      )
    }

    // 获取用户档案信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      profile: profile,
      session: authData.session,
      message: '登录成功！'
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: '登录失败：' + String(error) },
      { status: 500 }
    )
  }
}