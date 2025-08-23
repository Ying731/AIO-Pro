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
    const goalData = await request.json()
    
    console.log('Creating goal with data:', goalData)

    if (!goalData.student_id) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    // 验证学生记录是否存在
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', goalData.student_id)
      .single()

    if (studentError || !student) {
      console.error('Student not found:', studentError)
      return NextResponse.json(
        { error: '找不到对应的学生记录' },
        { status: 404 }
      )
    }

    // 插入目标记录
    const { data: newGoal, error: goalError } = await supabaseAdmin
      .from('learning_goals')
      .insert([{
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        status: goalData.status || 'not_started',
        progress: goalData.progress || 0,
        target_date: goalData.target_date,
        completion_date: goalData.completion_date,
        student_id: goalData.student_id
      }])
      .select()
      .single()

    if (goalError) {
      console.error('Error creating goal:', goalError)
      return NextResponse.json(
        { error: '创建目标失败：' + goalError.message },
        { status: 500 }
      )
    }

    console.log('Goal created successfully:', newGoal)
    
    return NextResponse.json({
      success: true,
      data: newGoal,
      message: '目标创建成功'
    })

  } catch (error) {
    console.error('Create goal API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const studentId = url.searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    const { data: goals, error } = await supabaseAdmin
      .from('learning_goals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      return NextResponse.json(
        { error: '获取目标失败：' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: goals || [],
      message: '获取目标成功'
    })

  } catch (error) {
    console.error('Get goals API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}