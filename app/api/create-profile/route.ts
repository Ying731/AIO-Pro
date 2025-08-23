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
    const { userId, email, fullName, role, ...otherData } = await request.json()

    console.log('Creating user profile after email verification:', { userId, email, role })

    // 1. 创建用户档案
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: userId,
        email,
        full_name: fullName,
        role
      }])

    if (profileError) {
      // 如果档案已存在，不算错误
      if (!profileError.message?.includes('duplicate') && !profileError.code?.includes('23505')) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json(
          { error: '档案创建失败：' + profileError.message }, 
          { status: 400 }
        )
      }
      console.log('Profile already exists, skipping')
    } else {
      console.log('Profile created successfully')
    }

    // 2. 创建角色相关记录
    if (role === 'student') {
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
        // 如果学生记录已存在，不算错误
        if (!studentError.message?.includes('duplicate') && !studentError.code?.includes('23505')) {
          console.error('Student record error:', studentError)
        } else {
          console.log('Student record already exists, skipping')
        }
      } else {
        console.log('Student record created successfully')
      }

    } else if (role === 'teacher') {
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
        // 如果教师记录已存在，不算错误
        if (!teacherError.message?.includes('duplicate') && !teacherError.code?.includes('23505')) {
          console.error('Teacher record error:', teacherError)
        } else {
          console.log('Teacher record already exists, skipping')
        }
      } else {
        console.log('Teacher record created successfully')
      }
    }

    return NextResponse.json({
      success: true,
      message: '用户档案创建成功'
    })

  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { error: '档案创建失败：' + String(error) }, 
      { status: 500 }
    )
  }
}