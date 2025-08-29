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

// 任务生成的AI提示词模板
const TASK_GENERATION_PROMPT = `你是一个专业的学习规划师。基于学生的OKR目标，为其生成今日具体的学习任务。

学生的OKR信息：
{okr_context}

任务生成规则：
1. 生成3-5条今日具体可执行的学习任务
2. 每个任务包含：类别标签、具体描述、预估时长
3. 优先推进进度较低的关键结果
4. 任务难度适中，符合学生当前学习节奏
5. 考虑目标截止日期，合理安排紧迫性
6. 每个任务时长控制在30分钟到3小时之间

输出格式示例：
1. 【理论学习】复习数据结构中的链表概念和操作 (1小时)
2. 【编程练习】完成10道链表相关的算法题 (2小时)  
3. 【项目实践】在React项目中实现用户登录功能 (1.5小时)

请直接输出任务列表，不要额外解释。每个任务单独一行，按重要性排序。`

// 定义接口类型
interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  progress: number
  target_date: string | null
  key_results: Array<{
    text: string
    progress: number
    completed: boolean
  }>
}

interface DailyTaskRequest {
  student_id: string
}

interface DailyTaskResponse {
  success: boolean
  data?: {
    tasks: string[]
    basedOnGoals: string[]
    generatedAt: string
    totalEstimatedTime: string
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<DailyTaskResponse>> {
  try {
    const requestData: DailyTaskRequest = await request.json()
    
    console.log('Generating daily tasks for student:', requestData.student_id)

    if (!requestData.student_id) {
      return NextResponse.json(
        { success: false, error: '缺少学生ID参数' },
        { status: 400 }
      )
    }

    // 1. 查询学生的活跃OKR目标
    const { data: activeGoals, error: goalsError } = await supabaseAdmin
      .from('learning_goals')
      .select('*')
      .eq('student_id', requestData.student_id)
      .in('status', ['in_progress', 'not_started'])
      .order('priority', { ascending: false })
      .order('target_date', { ascending: true })

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return NextResponse.json(
        { success: false, error: '查询目标数据失败: ' + goalsError.message },
        { status: 500 }
      )
    }

    if (!activeGoals || activeGoals.length === 0) {
      return NextResponse.json(
        { success: false, error: '您暂时没有活跃的学习目标，请先创建一些OKR目标。' },
        { status: 404 }
      )
    }

    console.log(`Found ${activeGoals.length} active goals for task generation`)

    // 2. 构建OKR上下文
    const okrContext = activeGoals.map((goal: Goal, index: number) => {
      const keyResultsText = goal.key_results && goal.key_results.length > 0
        ? goal.key_results
            .filter(kr => kr.text && kr.text.trim())
            .map((kr, i) => `  KR${i + 1}: ${kr.text} (当前进度: ${kr.progress}%, ${kr.completed ? '已完成' : '进行中'})`)
            .join('\n')
        : '  暂无具体关键结果'

      const urgency = goal.target_date 
        ? (() => {
            const today = new Date()
            const targetDate = new Date(goal.target_date)
            const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return daysLeft <= 7 ? '【紧急】' : daysLeft <= 30 ? '【重要】' : '【一般】'
          })()
        : '【一般】'

      return `
目标${index + 1}: ${goal.title} ${urgency}
描述: ${goal.description}
类别: ${goal.category}
优先级: ${goal.priority}
当前进度: ${goal.progress}%
截止日期: ${goal.target_date ? new Date(goal.target_date).toLocaleDateString() : '无'}
关键结果:
${keyResultsText}
---`
    }).join('\n')

    console.log('Built OKR context for AI generation')

    // 3. 调用AI生成任务（目前使用模拟数据，后续集成真实LLM）
    const tasks = await generateTasksWithAI(okrContext, activeGoals)

    // 4. 计算预估总时长
    const totalEstimatedTime = calculateTotalTime(tasks)

    // 5. 返回结果
    const response: DailyTaskResponse = {
      success: true,
      data: {
        tasks: tasks,
        basedOnGoals: activeGoals.map(goal => goal.title),
        generatedAt: new Date().toISOString(),
        totalEstimatedTime: totalEstimatedTime
      }
    }

    console.log('Daily tasks generated successfully:', {
      taskCount: tasks.length,
      totalTime: totalEstimatedTime
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Daily tasks API error:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}

// AI任务生成函数（暂时使用模拟逻辑，后续替换为真实LLM调用）
async function generateTasksWithAI(okrContext: string, goals: Goal[]): Promise<string[]> {
  // TODO: 后续替换为真实的OpenAI/Gemini API调用
  // 目前使用基于OKR数据的智能模拟生成
  
  const tasks: string[] = []
  
  for (const goal of goals.slice(0, 2)) { // 限制最多基于2个目标生成任务
    const category = getCategoryDisplayName(goal.category)
    
    // 基于关键结果生成具体任务
    if (goal.key_results && goal.key_results.length > 0) {
      const incompleteKRs = goal.key_results.filter(kr => !kr.completed && kr.progress < 100)
      
      if (incompleteKRs.length > 0) {
        const kr = incompleteKRs[0] // 选择第一个未完成的关键结果
        const estimatedTime = goal.priority === 'high' ? '2小时' : '1.5小时'
        tasks.push(`【${category}】${kr.text} - 针对"${goal.title}" (${estimatedTime})`)
      }
    } else {
      // 如果没有关键结果，基于目标本身生成任务
      const estimatedTime = goal.priority === 'high' ? '2小时' : '1.5小时'
      tasks.push(`【${category}】推进"${goal.title}"的学习计划 (${estimatedTime})`)
    }
    
    // 添加复习巩固任务
    if (goal.progress > 20) {
      tasks.push(`【复习巩固】整理"${goal.title}"的学习笔记和重点内容 (30分钟)`)
    }
  }

  // 确保至少有3个任务
  if (tasks.length < 3) {
    tasks.push('【学习规划】回顾今日学习目标，调整明日计划 (20分钟)')
  }

  // 限制最多5个任务
  return tasks.slice(0, 5)
}

// 获取类别显示名称
function getCategoryDisplayName(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'academic': '课程学习',
    'skill': '技能提升', 
    'project': '项目实践',
    'personal': '个人发展',
    'career': '职业规划'
  }
  return categoryMap[category] || '学习任务'
}

// 计算总预估时长
function calculateTotalTime(tasks: string[]): string {
  let totalMinutes = 0
  
  tasks.forEach(task => {
    // 从任务描述中提取时长信息
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

// PUT 方法：保存每日任务到数据库
export async function PUT(request: NextRequest) {
  try {
    const { student_id, tasks, basedOnGoals, generation_session_id } = await request.json()
    
    console.log('Saving daily tasks:', { student_id, tasks: tasks?.length, basedOnGoals })

    if (!student_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'student_id is required' 
      }, { status: 400 })
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tasks array is required and must not be empty' 
      }, { status: 400 })
    }

    // 验证学生是否存在
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      console.error('Student not found:', studentError)
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 })
    }

    // 获取学生的OKR目标信息（用于关联）
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('learning_goals')
      .select('id, title, category')
      .eq('student_id', student_id)
      .in('status', ['in_progress', 'not_started'])

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch student goals' 
      }, { status: 500 })
    }

    // 生成唯一的会话ID（服务器端生成UUID）
    const sessionId = generation_session_id && generation_session_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
      ? generation_session_id 
      : crypto.randomUUID()
    const today = new Date().toISOString().split('T')[0]

    // 准备任务数据
    const taskRecords = tasks.map((taskContent: string, index: number) => {
      // 确保 taskContent 不为空
      if (!taskContent || typeof taskContent !== 'string') {
        console.warn(`Invalid task content at index ${index}:`, taskContent)
        taskContent = '学习任务'
      }
      
      // 从任务内容中提取信息
      const categoryMatch = taskContent.match(/【([^】]+)】/)
      const category = categoryMatch ? categoryMatch[1] : '学习任务'
      
      // 提取时长
      const timeMatch = taskContent.match(/\(([^)]+)\)/)
      let estimatedMinutes = 60 // 默认60分钟
      
      if (timeMatch) {
        const timeStr = timeMatch[1]
        if (timeStr && timeStr.includes('小时')) {
          const hours = parseFloat(timeStr.replace('小时', ''))
          estimatedMinutes = hours * 60
        } else if (timeStr && timeStr.includes('分钟')) {
          estimatedMinutes = parseFloat(timeStr.replace('分钟', ''))
        }
      }

      // 尝试匹配相关的OKR目标
      let sourceGoalId = null
      let goalTitle = ''
      
      if (goals && goals.length > 0) {
        // 简单的关键词匹配找到相关目标
        const relatedGoal = goals.find(goal => 
          (taskContent && goal.title && taskContent.includes(goal.title)) || 
          (basedOnGoals && Array.isArray(basedOnGoals) && 
           basedOnGoals.some((baseGoal: string) => 
             baseGoal && typeof baseGoal === 'string' && 
             goal.title && typeof goal.title === 'string' && 
             baseGoal.includes(goal.title)))
        )
        
        if (relatedGoal) {
          sourceGoalId = relatedGoal.id
          goalTitle = relatedGoal.title
        } else {
          // 如果没有匹配，使用第一个目标作为默认
          sourceGoalId = goals[0].id
          goalTitle = goals[0].title
        }
      }

      return {
        student_id,
        task_content: taskContent,
        task_category: category,
        estimated_minutes: Math.round(estimatedMinutes),
        status: 'pending',
        source_goal_id: sourceGoalId,
        source_key_result_index: 0, // 默认关联第一个关键结果
        goal_title: goalTitle,
        generation_session_id: sessionId,
        task_order: index + 1,
        task_date: today
      }
    })

    console.log('Prepared task records:', taskRecords.length)

    // 批量插入任务
    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from('daily_tasks')
      .insert(taskRecords)
      .select('*')

    if (insertError) {
      console.error('Error inserting tasks:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to save tasks: ${insertError.message}` 
      }, { status: 500 })
    }

    // 创建任务会话记录（可选）
    if (basedOnGoals && basedOnGoals.length > 0) {
      const { error: sessionError } = await supabaseAdmin
        .from('daily_task_sessions')
        .insert({
          student_id,
          generation_date: today,
          total_tasks: tasks.length,
          based_on_goals: basedOnGoals,
          ai_prompt_used: `基于${basedOnGoals.length}个OKR目标生成${tasks.length}个每日任务`
        })

      if (sessionError) {
        console.warn('Failed to create session record:', sessionError)
        // 不阻断主流程，只记录警告
      }
    }

    console.log(`Successfully saved ${insertedTasks?.length} tasks for student ${student_id}`)

    return NextResponse.json({
      success: true,
      message: `成功保存${insertedTasks?.length}个每日任务`,
      data: {
        tasks: insertedTasks,
        session_id: sessionId,
        saved_count: insertedTasks?.length
      }
    })

  } catch (error: any) {
    console.error('Error in PUT /api/daily-tasks:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    }, { status: 500 })
  }
}