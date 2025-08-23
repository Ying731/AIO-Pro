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

    // 1. 创建认证用户（需要邮箱验证）
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 恢复邮箱验证流程
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

    console.log('User created:', authData.user.id)

    // 2. 发送验证邮件
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role,
        ...otherData
      },
      redirectTo: `${process.env.APP_URL || 'http://localhost:3006'}/auth/callback`
    })

    if (inviteError) {
      console.log('邮件发送失败，但用户已创建:', inviteError.message)
    } else {
      console.log('验证邮件已发送')
    }

    // 2. 检查档案是否已存在，如果不存在则创建
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          role
        }])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json(
          { error: '档案创建失败：' + profileError.message }, 
          { status: 400 }
        )
      }
      console.log('Profile created')
    } else {
      console.log('Profile already exists, skipping creation')
    }

    // 3. 创建角色相关记录
    if (role === 'student') {
      // 检查学生记录是否已存在
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('user_id', authData.user.id)
        .single()

      if (!existingStudent) {
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .insert([{
            user_id: authData.user.id,
            student_id: otherData.studentId || '',
            grade: parseInt(otherData.grade) || 1,
            major: otherData.major || '未指定专业',
            class_name: '',
            enrollment_year: new Date().getFullYear(),
            status: 'active',
            gpa: 0.0,
            total_credits: 0
          }])

        if (studentError) {
          console.error('Student record error:', studentError)
        } else {
          console.log('Student record created')
        }
      } else {
        console.log('Student record already exists')
      }
    } else if (role === 'teacher') {
      // 检查教师记录是否已存在
      const { data: existingTeacher } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('user_id', authData.user.id)
        .single()

      if (!existingTeacher) {
        const { error: teacherError } = await supabaseAdmin
          .from('teachers')
          .insert([{
            user_id: authData.user.id,
            employee_id: otherData.employeeId || '',
            department: otherData.department || '未指定部门',
            title: otherData.title || '讲师',
            research_areas: [],
            office_location: '',
            contact_phone: ''
          }])

        if (teacherError) {
          console.error('Teacher record error:', teacherError)
        } else {
          console.log('Teacher record created')
        }
      } else {
        console.log('Teacher record already exists')
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role
      },
      message: '注册成功！请检查您的邮箱以验证账户，验证后即可登录。'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: '注册失败：' + String(error) }, 
      { status: 500 }
    )
  }
}