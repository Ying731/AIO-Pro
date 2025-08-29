import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥创建Supabase管理客户端
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    console.log('🧪 TEST API - Checking data for user:', userId)

    // 1. 检查students表
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', userId || '3d46d115-6f4c-4bcb-bed5-83da95a00629')

    console.log('👥 Students data:', { students, studentsError })

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No student record found',
        debug: {
          userId,
          students,
          studentsError
        }
      })
    }

    const studentId = students[0].id
    console.log('✅ Found student ID:', studentId)

    // 2. 检查daily_tasks表
    const { data: dailyTasks, error: tasksError } = await supabaseAdmin
      .from('daily_tasks')
      .select('*')
      .eq('student_id', studentId)

    console.log('📋 Daily tasks data:', { dailyTasks, tasksError })

    // 3. 检查learning_goals表
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('learning_goals')
      .select('*')
      .eq('student_id', studentId)

    console.log('🎯 Goals data:', { goals, goalsError })

    // 4. 返回完整的调试信息
    return NextResponse.json({
      success: true,
      debug: {
        input: { userId },
        students: {
          data: students,
          error: studentsError,
          found: students.length
        },
        dailyTasks: {
          data: dailyTasks,
          error: tasksError,
          found: dailyTasks?.length || 0,
          today: dailyTasks?.filter(t => t.task_date === new Date().toISOString().split('T')[0]).length || 0
        },
        goals: {
          data: goals,
          error: goalsError,
          found: goals?.length || 0
        },
        summary: {
          studentId,
          totalTasks: dailyTasks?.length || 0,
          todayTasks: dailyTasks?.filter(t => t.task_date === new Date().toISOString().split('T')[0]).length || 0,
          totalGoals: goals?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('❌ TEST API error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      debug: null
    }, { status: 500 })
  }
}