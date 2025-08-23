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
      // 如果用户不存在，创建新用户
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 直接确认邮箱，避免复杂的验证流程
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
      console.log('User created:', userId)

      // 对于生产环境，发送欢迎邮件而不是验证邮件
      if (process.env.NODE_ENV === 'production') {
        console.log('用户注册成功，邮箱已自动验证')
      } else {
        console.log('开发环境：用户注册成功，邮箱已自动验证')
      }
    }

    // 2. 检查档案是否已存在，如果不存在则创建
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: userId,
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
        .eq('user_id', userId)
        .single()

      if (!existingStudent) {
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .insert([{
            user_id: userId,
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
        .eq('user_id', userId)
        .single()

      if (!existingTeacher) {
        const { error: teacherError } = await supabaseAdmin
          .from('teachers')
          .insert([{
            user_id: userId,
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
        id: userId,
        email: email,
        role
      },
      message: '注册成功！您现在可以直接登录使用系统。'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: '注册失败：' + String(error) }, 
      { status: 500 }
    )
  }
}