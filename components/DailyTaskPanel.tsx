'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, Play, RotateCcw, Target, Calendar, Timer, TrendingUp, Brain, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

interface DailyTask {
  id: string
  student_id: string
  task_content: string
  task_category: string
  estimated_minutes: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  source_goal_id: string | null
  source_key_result_index: number | null
  goal_title: string | null
  generation_session_id: string | null
  task_order: number
  task_date: string
  created_at: string
  completed_at: string | null
  actual_minutes: number | null
  difficulty_rating: number | null
  completion_notes: string | null
}

const STATUS_CONFIG = {
  pending: { name: '待办', color: 'bg-gray-100 text-gray-800', icon: Clock, iconColor: 'text-gray-600' },
  in_progress: { name: '进行中', color: 'bg-blue-100 text-blue-800', icon: Play, iconColor: 'text-blue-600' },
  completed: { name: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle, iconColor: 'text-green-600' },
  cancelled: { name: '已取消', color: 'bg-red-100 text-red-800', icon: RotateCcw, iconColor: 'text-red-600' }
}

export default function DailyTaskPanel() {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeGoalsCount, setActiveGoalsCount] = useState(0)
  
  // 每日任务推荐相关状态
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [dailyTasks, setDailyTasks] = useState<string[]>([])
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)
  const [taskError, setTaskError] = useState<string | null>(null)
  const [taskGeneratedAt, setTaskGeneratedAt] = useState<string>('')
  const [basedOnGoals, setBasedOnGoals] = useState<string[]>([])
  const [totalEstimatedTime, setTotalEstimatedTime] = useState<string>('')

  useEffect(() => {
    initializeData()
  }, [selectedDate])

  const initializeData = async () => {
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No authenticated user found for DailyTaskPanel')
        setLoading(false)
        return
      }

      console.log(`🔐 DailyTaskPanel - Current user: ${user.id} (${user.email})`)

      // 获取学生信息
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single()

      console.log(`👤 Student query result:`, { student, studentError })

      if (student && !studentError) {
        console.log(`✅ Found student record: ${student.id} for user: ${student.user_id}`)
        setStudentId(student.id)
        await loadDailyTasks(student.id)
        await checkActiveGoals(student.id)
      } else {
        console.log('❌ No student record found, student table may be missing data')
        console.error('Student error details:', studentError)
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Error in initializeData:', error)
      setLoading(false)
    }
  }

  const loadDailyTasks = async (studentId: string) => {
    try {
      console.log(`🔍 Loading daily tasks for student: ${studentId}, date: ${selectedDate}`)
      
      // 添加错误处理和数据验证
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('student_id', studentId)
        .eq('task_date', selectedDate)
        .order('task_order', { ascending: true })

      console.log(`📊 Supabase query result:`, { data, error, dataCount: data?.length })

      if (error) {
        console.error('❌ Error loading daily tasks:', error)
        // 如果是表不存在的错误，设置为空数组
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.log('⚠️ Daily tasks table does not exist yet, showing empty state')
          setTasks([])
        }
        return
      }

      // 验证数据格式
      const validTasks = (data || []).filter(task => 
        task && typeof task === 'object' && task.id && task.task_content
      )

      console.log(`✅ Loaded ${validTasks.length} valid tasks for date ${selectedDate}`)
      console.log(`📋 Tasks data:`, validTasks.map(t => ({
        id: t.id,
        content: t.task_content?.substring(0, 50) + '...',
        date: t.task_date,
        status: t.status
      })))

      setTasks(validTasks)
    } catch (error) {
      console.error('💥 Error loading daily tasks:', error)
      setTasks([]) // 设置为空数组以防止界面崩溃
    } finally {
      setLoading(false)
    }
  }

  const checkActiveGoals = async (studentId: string) => {
    try {
      const response = await fetch(`/api/goals?student_id=${studentId}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        const activeGoals = (result.data || []).filter((goal: any) => 
          goal.status === 'in_progress' || goal.status === 'not_started'
        )
        setActiveGoalsCount(activeGoals.length)
      } else {
        console.error('Error loading goals:', result.error)
        setActiveGoalsCount(0)
      }
    } catch (error) {
      console.error('Error checking active goals:', error)
      setActiveGoalsCount(0)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: DailyTask['status']) => {
    if (!studentId) return

    try {
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null
      
      const { error } = await supabase
        .from('daily_tasks')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', taskId)
        .eq('student_id', studentId)

      if (error) {
        console.error('Error updating task status:', error)
        return
      }

      // 更新本地状态
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completed_at: completedAt }
          : task
      ))
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const getStatusIcon = (status: DailyTask['status']) => {
    const config = STATUS_CONFIG[status]
    const IconComponent = config.icon
    return <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
  }

  const getTasksByGoal = () => {
    const grouped = tasks.reduce((acc, task) => {
      const goalTitle = task.goal_title || '其他任务'
      if (!acc[goalTitle]) {
        acc[goalTitle] = []
      }
      acc[goalTitle].push(task)
      return acc
    }, {} as Record<string, DailyTask[]>)

    return Object.entries(grouped).map(([goalTitle, tasks]) => ({
      goalTitle,
      tasks
    }))
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0)
    
    return { total, completed, inProgress, pending, totalMinutes }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
    }
    return `${mins}分钟`
  }

  // 保存每日任务到数据库
  const saveDailyTasks = async () => {
    if (!studentId) {
      alert('用户信息不完整，请重新登录')
      return
    }

    if (!dailyTasks || dailyTasks.length === 0) {
      alert('没有任务可以保存')
      return
    }

    try {
      console.log('Saving daily tasks to database...', {
        studentId,
        tasksCount: dailyTasks.length,
        basedOnGoals
      })

      const response = await fetch('/api/daily-tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          tasks: dailyTasks,
          basedOnGoals: basedOnGoals,
          // 让服务器端生成UUID，不传递generation_session_id
        })
      })

      const result = await response.json()
      console.log('Save tasks API response:', result)

      if (response.ok && result.success) {
        alert(`✅ ${result.message || '任务保存成功！'}`)
        // 关闭弹窗并重新加载任务
        setShowTaskModal(false)
        setDailyTasks([])
        setTaskError(null)
        // 重新加载今日任务
        await loadDailyTasks(studentId)
      } else {
        throw new Error(result.error || 'API request failed')
      }
    } catch (error: any) {
      console.error('Error saving daily tasks:', error)
      alert(`❌ 保存任务失败：${error?.message || String(error)}`)
    }
  }

  // 生成每日任务推荐
  const generateDailyTasks = async () => {
    if (!studentId) {
      alert('用户信息不完整，请重新登录')
      return
    }

    // 检查是否有活跃的OKR目标
    if (activeGoalsCount === 0) {
      alert('您暂时没有活跃的学习目标，请先在OKR管理中创建一些目标。')
      return
    }

    setIsGeneratingTasks(true)
    setTaskError(null)
    setShowTaskModal(true)

    try {
      console.log('🤖 Generating daily tasks via N8N for student:', studentId)
      
      // 优先尝试N8N工作流
      let response = await fetch('/api/daily-tasks-n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          preferences: {
            taskCount: 5,
            maxDuration: 480,
            priorities: ['high', 'medium']
          }
        })
      })

      let result = await response.json()
      
      // 如果N8N失败，尝试原始API作为备选
      if (!response.ok || !result.success) {
        console.log('🔄 N8N failed, trying local API:', result.error)
        
        response = await fetch('/api/daily-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId
          })
        })
        
        result = await response.json()
      }

      console.log('📊 Daily tasks API response:', { 
        success: result.success, 
        source: result.data?.source || 'unknown',
        taskCount: result.data?.tasks?.length 
      })

      if (response.ok && result.success) {
        setDailyTasks(result.data.tasks || [])
        setBasedOnGoals(result.data.basedOnGoals || [])
        setTaskGeneratedAt(result.data.generatedAt || '')
        setTotalEstimatedTime(result.data.totalEstimatedTime || '')
        
        // 显示数据源信息
        const source = result.data.source || 'unknown'
        const sourceText = source === 'n8n-workflow' ? 'N8N工作流+Gemini AI' : 
                          source === 'local-fallback' ? '本地备用算法' : '标准算法'
        console.log(`✅ Tasks generated successfully via: ${sourceText}`)
        
      } else {
        throw new Error(result.error || 'API request failed')
      }
    } catch (error: any) {
      console.error('💥 Error generating daily tasks:', error)
      setTaskError(`任务生成失败: ${error?.message || String(error)}`)
    } finally {
      setIsGeneratingTasks(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const stats = getTaskStats()
  const tasksByGoal = getTasksByGoal()

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* 头部 - 固定不滚动 */}
      <div className="flex-shrink-0 p-6 border-b">
        {/* 第一行：标题和日期选择器 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">今日任务</h3>
              <p className="text-sm text-gray-500">管理您的每日学习任务</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={generateDailyTasks}
              disabled={isGeneratingTasks || activeGoalsCount === 0}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isGeneratingTasks 
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : activeGoalsCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={activeGoalsCount === 0 ? '请先在OKR管理中创建学习目标' : '根据OKR目标生成今日任务'}
            >
              {isGeneratingTasks ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {isGeneratingTasks ? 'AI思考中...' : '生成今日任务'}
            </button>
          </div>
        </div>

        {/* 第二行：任务统计 - 调整大小与OKR面板对齐 */}
        <div className="flex items-center justify-between">
          {/* 空白区域占位，保持结构对称 */}
          <div></div>

          {/* 任务统计 */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{stats.total}</div>
              <div className="text-xs text-gray-600">总任务</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-600">待办</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-blue-600">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-green-600">已完成</div>
            </div>
            {stats.total > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{Math.round((stats.completed / stats.total) * 100)}%</div>
                <div className="text-xs text-orange-600">完成率</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 任务列表 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无今日任务</h3>
            <p className="text-gray-500">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? '您今天还没有学习任务，去OKR管理中生成一些任务吧！'
                : '该日期没有学习任务记录'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tasksByGoal.map(({ goalTitle, tasks }) => (
              <div key={goalTitle} className="space-y-3">
                {/* OKR目标标题 */}
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-gray-900">{goalTitle}</h4>
                  <span className="text-sm text-gray-500">({tasks.length}个任务)</span>
                </div>
                
                {/* 该目标下的任务列表 */}
                <div className="space-y-2 ml-6">
                  {tasks.map((task) => {
                    const statusConfig = STATUS_CONFIG[task.status]
                    return (
                      <div key={task.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(task.status)}
                              <span className="text-sm text-gray-500">#{task.task_order}</span>
                              {task.task_category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {task.task_category}
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.name}
                              </span>
                            </div>
                            
                            <p className="text-gray-800 mb-2">{task.task_content}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {task.estimated_minutes && (
                                <span className="flex items-center space-x-1">
                                  <Timer className="w-3 h-3" />
                                  <span>预估 {formatTime(task.estimated_minutes)}</span>
                                </span>
                              )}
                              <span>创建于 {new Date(task.created_at).toLocaleTimeString()}</span>
                              {task.completed_at && (
                                <span>完成于 {new Date(task.completed_at).toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* 任务状态操作按钮 */}
                          <div className="flex items-center space-x-2 ml-4">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="开始任务"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="完成任务"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {task.status === 'completed' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'pending')}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                title="重置任务"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 每日任务推荐弹窗 */}
      {showTaskModal && (
        <DailyTaskModal
          isLoading={isGeneratingTasks}
          tasks={dailyTasks}
          error={taskError}
          basedOnGoals={basedOnGoals}
          totalEstimatedTime={totalEstimatedTime}
          generatedAt={taskGeneratedAt}
          onClose={() => {
            setShowTaskModal(false)
            setDailyTasks([])
            setTaskError(null)
          }}
          onRegenerate={generateDailyTasks}
          onSave={saveDailyTasks}
        />
      )}
    </div>
  )
}

// 每日任务推荐弹窗组件
function DailyTaskModal({
  isLoading,
  tasks,
  error,
  basedOnGoals,
  totalEstimatedTime,
  generatedAt,
  onClose,
  onRegenerate,
  onSave
}: {
  isLoading: boolean
  tasks: string[]
  error: string | null
  basedOnGoals: string[]
  totalEstimatedTime: string
  generatedAt: string
  onClose: () => void
  onRegenerate: () => void
  onSave: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 弹窗头部 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">AI助手 - 今日学习任务推荐</h3>
                <p className="text-sm text-gray-500">基于您的OKR目标智能生成</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ArrowRight className="w-5 h-5 text-gray-400 transform rotate-45" />
            </button>
          </div>

          {/* 基于的目标信息 */}
          {basedOnGoals.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">📚 基于以下目标生成：</h4>
              <div className="flex flex-wrap gap-2">
                {basedOnGoals.map((goal, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">AI正在基于您的OKR目标生成个性化学习任务...</p>
              <p className="text-sm text-gray-500 mt-2">这可能需要几秒钟时间</p>
            </div>
          )}

          {/* 错误状态 */}
          {error && !isLoading && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">生成失败</h4>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onRegenerate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                重新生成
              </button>
            </div>
          )}

          {/* 任务列表 */}
          {!isLoading && !error && tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">✅ 今日推荐任务</h4>
                {totalEstimatedTime && (
                  <span className="text-sm text-gray-500">总预估时长: {totalEstimatedTime}</span>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                {tasks.map((task, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">{task}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 学习建议 */}
              <div className="mb-6 p-3 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-800 mb-2">💡 学习建议：</h5>
                <p className="text-sm text-green-700">
                  建议按照任务顺序执行，理论学习→实践练习→复习巩固的学习路径效果最佳。
                  记得适当休息，保持专注度！
                </p>
              </div>
            </div>
          )}

          {/* 底部操作按钮 */}
          {!isLoading && (
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                关闭
              </button>
              {!error && tasks.length > 0 && (
                <>
                  <button
                    onClick={onRegenerate}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ✨ 重新生成
                  </button>
                  <button
                    onClick={onSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    📝 保存任务
                  </button>
                </>
              )}
            </div>
          )}

          {/* 生成时间 */}
          {generatedAt && !isLoading && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-gray-500 text-center">
                生成时间: {new Date(generatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}