import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// N8N工作流配置
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-ohuqvtxy.ap-southeast-1.clawcloudrun.com/webhook'
const N8N_DAILY_TASKS_ENDPOINT = `${N8N_WEBHOOK_URL}/generate-daily-tasks`

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

interface DailyTaskRequest {
  student_id: string
  preferences?: {
    taskCount?: number
    maxDuration?: number
    priorities?: string[]
  }
}

interface N8NTaskResponse {
  success: boolean
  data: {
    tasks: Array<{
      task_content: string
      task_category: string
      estimated_minutes: number
      task_order: number
      status: string
    }>
    basedOnGoals: string[]
    generatedAt: string
    totalEstimatedTime: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestData: DailyTaskRequest = await request.json()
    
    console.log('🤖 Generating daily tasks via N8N for student:', requestData.student_id)

    if (!requestData.student_id) {
      return NextResponse.json(
        { success: false, error: '缺少学生ID参数' },
        { status: 400 }
      )
    }

    // 验证学生是否存在
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', requestData.student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: '学生不存在' },
        { status: 404 }
      )
    }

    // 调用N8N工作流
    const n8nPayload = {
      student_id: requestData.student_id,
      date: new Date().toISOString().split('T')[0],
      preferences: {
        taskCount: 5,
        maxDuration: 480, // 8小时
        priorities: ['high', 'medium'],
        ...requestData.preferences
      }
    }

    console.log('📡 Calling N8N workflow:', N8N_DAILY_TASKS_ENDPOINT)
    console.log('📤 N8N payload:', n8nPayload)

    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

    try {
      const n8nResponse = await fetch(N8N_DAILY_TASKS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QimingxingPlatform/1.0'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!n8nResponse.ok) {
        console.error('❌ N8N workflow failed:', n8nResponse.status, n8nResponse.statusText)
        
        // 如果N8N失败，回退到本地生成
        console.log('🔄 Falling back to local task generation')
        return await generateTasksLocally(requestData.student_id)
      }

      const n8nResult: N8NTaskResponse = await n8nResponse.json()
      console.log('✅ N8N workflow response:', { success: n8nResult.success, taskCount: n8nResult.data?.tasks?.length })

      if (!n8nResult.success) {
        throw new Error(n8nResult.error || 'N8N workflow failed')
      }

      // 返回N8N生成的结果
      return NextResponse.json({
        success: true,
        data: {
          tasks: n8nResult.data.tasks.map(task => task.task_content),
          basedOnGoals: n8nResult.data.basedOnGoals,
          generatedAt: n8nResult.data.generatedAt,
          totalEstimatedTime: n8nResult.data.totalEstimatedTime,
          source: 'n8n-workflow'
        }
      })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ N8N request timeout after 30 seconds')
      } else {
        console.error('❌ N8N request failed:', fetchError.message)
      }
      
      // 回退到本地生成
      console.log('🔄 Falling back to local task generation due to N8N error')
      return await generateTasksLocally(requestData.student_id)
    }

  } catch (error: any) {
    console.error('💥 Daily tasks API error:', error)
    
    // 如果有student_id，尝试本地生成作为备选方案
    const requestData = await request.json().catch(() => ({}))
    if (requestData.student_id) {
      console.log('🔄 Attempting local fallback generation')
      return await generateTasksLocally(requestData.student_id)
    }
    
    return NextResponse.json(
      { success: false, error: '任务生成失败: ' + error.message },
      { status: 500 }
    )
  }
}

// 本地生成任务的备用函数
async function generateTasksLocally(studentId: string): Promise<NextResponse> {
  try {
    // 获取学生的OKR目标
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('learning_goals')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['in_progress', 'not_started'])
      .order('priority', { ascending: false })
      .limit(3)

    if (goalsError || !goals || goals.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有找到活跃的学习目标' },
        { status: 404 }
      )
    }

    // 使用简化的本地生成逻辑
    const tasks = goals.flatMap(goal => [
      `【${getCategoryName(goal.category)}】推进"${goal.title}" - 重点关注进度较低的关键结果 (1.5小时)`,
      `【复习巩固】整理"${goal.title}"的学习笔记和重点内容 (30分钟)`
    ]).slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        basedOnGoals: goals.map(g => g.title),
        generatedAt: new Date().toISOString(),
        totalEstimatedTime: calculateEstimatedTime(tasks),
        source: 'local-fallback'
      }
    })

  } catch (error) {
    console.error('❌ Local fallback failed:', error)
    return NextResponse.json(
      { success: false, error: '任务生成完全失败' },
      { status: 500 }
    )
  }
}

// 辅助函数
function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'academic': '课程学习',
    'skill': '技能提升', 
    'project': '项目实践',
    'personal': '个人发展',
    'career': '职业规划'
  }
  return categoryMap[category] || '学习任务'
}

function calculateEstimatedTime(tasks: string[]): string {
  let totalMinutes = 0
  
  tasks.forEach(task => {
    const timeMatch = task.match(/\(([^)]+)\)/)
    if (timeMatch) {
      const timeStr = timeMatch[1]
      if (timeStr.includes('小时')) {
        const hours = parseFloat(timeStr.replace('小时', ''))
        totalMinutes += hours * 60
      } else if (timeStr.includes('分钟')) {
        const minutes = parseFloat(timeStr.replace('分钟', ''))
        totalMinutes += minutes
      }
    }
  })
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours > 0 && minutes > 0) {
    return `约${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    return `约${hours}小时`
  } else {
    return `约${minutes}分钟`
  }
}

// 保持原有的PUT方法不变
export async function PUT(request: NextRequest) {
  // ... 保持原有的保存逻辑
}