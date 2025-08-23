import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 这个API路由用于处理邮件验证并创建用户档案
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取验证信息
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type') || 'invite'
    const email = url.searchParams.get('email')
    
    console.log('验证邮件API收到请求:', { token, type, email })
    
    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_token', request.url))
    }

    // 使用服务角色密钥创建Supabase客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.redirect(new URL('/?error=server_config', request.url))
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // 验证token
    let userId: string | undefined
    let userData: any = null
    
    try {
      // 尝试验证token
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: type as any
      })
      
      if (error) {
        console.error('验证token失败:', error)
        return NextResponse.redirect(new URL(`/?error=invalid_token&details=${encodeURIComponent(error.message)}`, request.url))
      }
      
      if (data?.user) {
        userId = data.user.id
        userData = data.user
        console.log('验证成功，用户ID:', userId)
      }
    } catch (err) {
      console.error('验证过程出错:', err)
      return NextResponse.redirect(new URL(`/?error=verification_error&details=${encodeURIComponent(String(err))}`, request.url))
    }
    
    // 如果验证成功，创建用户档案
    if (userId && userData) {
      try {
        // 检查用户档案是否已存在
        const { data: existingProfiles } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log('用户档案已存在:', existingProfiles[0])
        } else {
          // 创建新的用户档案
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([
              {
                user_id: userId,
                email: userData.email,
                full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || '用户',
                role: userData.user_metadata?.role || 'student',
                ...userData.user_metadata
              }
            ])
            .select()
          
          if (profileError) {
            console.error('创建用户档案失败:', profileError)
            // 即使档案创建失败，我们仍然允许用户登录
          } else {
            console.log('用户档案创建成功:', profile)
          }
        }
        
        // 验证成功，重定向到登录页面
        return NextResponse.redirect(new URL('/?verified=true', request.url))
      } catch (err) {
        console.error('处理用户档案时出错:', err)
        // 即使出错，我们仍然允许用户登录
        return NextResponse.redirect(new URL('/?verified=true&profile_error=true', request.url))
      }
    } else {
      return NextResponse.redirect(new URL('/?error=no_user_data', request.url))
    }
  } catch (error) {
    console.error('验证邮件API错误:', error)
    return NextResponse.redirect(new URL(`/?error=server_error&details=${encodeURIComponent(String(error))}`, request.url))
  }
}