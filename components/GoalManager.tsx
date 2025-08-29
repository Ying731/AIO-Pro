'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Target, Plus, CheckCircle, Clock, AlertCircle, Edit, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface KeyResult {
  text: string
  progress: number
  completed: boolean
}

interface Goal {
  id: string
  title: string
  description: string
  category: 'academic' | 'skill' | 'project' | 'personal' | 'career'
  priority: 'high' | 'medium' | 'low'
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
  progress: number
  target_date: string | null
  completion_date: string | null
  key_results: KeyResult[]
  created_at: string
  updated_at: string
}

const CATEGORIES = {
  academic: { name: '学业目标', color: 'bg-blue-100 text-blue-800' },
  skill: { name: '技能提升', color: 'bg-green-100 text-green-800' },
  project: { name: '项目实践', color: 'bg-purple-100 text-purple-800' },
  personal: { name: '个人发展', color: 'bg-yellow-100 text-yellow-800' },
  career: { name: '职业规划', color: 'bg-indigo-100 text-indigo-800' }
}

const PRIORITIES = {
  high: { name: '高', color: 'bg-red-100 text-red-800' },
  medium: { name: '中', color: 'bg-yellow-100 text-yellow-800' },
  low: { name: '低', color: 'bg-green-100 text-green-800' }
}

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user found')
        loadMockData()
        return
      }

      console.log('Current user:', user.id, user.email)

      // 获取学生信息
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user_id, student_id')
        .eq('user_id', user.id)
        .single()

      console.log('Student query result:', { student, studentError })

      if (student && !studentError) {
        console.log('Found student record:', student)
        setStudentId(student.id)
        await loadGoals(student.id)
      } else {
        console.log('No student record found, error:', studentError)
        // 创建学生记录
        await createStudentRecord(user)
      }
    } catch (error) {
      console.error('Error in initializeData:', error)
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const createStudentRecord = async (user: any) => {
    try {
      console.log('Creating student record for user:', user.id)
      
      // 先检查是否有profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('User profile:', profile)
      
      if (!profile) {
        console.log('No profile found, cannot create student record')
        loadMockData()
        return
      }

      // 创建学生记录
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert([{
          user_id: user.id,
          student_id: user.email?.split('@')[0] || `STU${Date.now()}`,
          grade: 1,
          major: '软件工程',
          class_name: '软件工程1班',
          enrollment_year: new Date().getFullYear(),
          status: 'active',
          gpa: 0.0,
          total_credits: 0
        }])
        .select()
        .single()

      console.log('Create student result:', { newStudent, createError })

      if (newStudent && !createError) {
        setStudentId(newStudent.id)
        await loadGoals(newStudent.id)
      } else {
        console.error('Failed to create student record:', createError)
        loadMockData()
      }
    } catch (error) {
      console.error('Error creating student record:', error)
      loadMockData()
    }
  }

  const loadGoals = async (studentId: string) => {
    try {
      const response = await fetch(`/api/goals?student_id=${studentId}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setGoals(result.data || [])
      } else {
        console.error('Error loading goals from API:', result.error)
        throw new Error(result.error || 'Failed to load goals')
      }
    } catch (error) {
      console.error('Error loading goals:', error)
      loadMockData()
    }
  }

  const loadMockData = () => {
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: '完成数据结构课程',
        description: '掌握链表、树、图等基本数据结构，期末考试达到85分以上',
        category: 'academic',
        priority: 'high',
        status: 'in_progress',
        progress: 65,
        target_date: '2024-12-15',
        completion_date: null,
        key_results: [
          { text: '掌握链表和数组操作', progress: 80, completed: false },
          { text: '理解树和图的遍历算法', progress: 60, completed: false },
          { text: '期末考试达到85分以上', progress: 0, completed: false }
        ],
        created_at: '2024-09-01',
        updated_at: '2024-11-15'
      },
      {
        id: '2',
        title: '学习React框架',
        description: '深入学习React Hooks、状态管理，完成一个完整的项目',
        category: 'skill',
        priority: 'medium',
        status: 'in_progress',
        progress: 40,
        target_date: '2024-11-30',
        completion_date: null,
        key_results: [
          { text: '掌握React Hooks用法', progress: 60, completed: false },
          { text: '学习Redux状态管理', progress: 30, completed: false },
          { text: '完成一个完整项目', progress: 20, completed: false }
        ],
        created_at: '2024-10-01',
        updated_at: '2024-11-10'
      },
      {
        id: '3',
        title: '参加编程竞赛',
        description: '参加ACM程序设计竞赛，提升算法解题能力',
        category: 'project',
        priority: 'medium',
        status: 'not_started',
        progress: 0,
        target_date: '2024-12-20',
        completion_date: null,
        key_results: [
          { text: '每日练习算法题', progress: 0, completed: false },
          { text: '参加线上模拟赛', progress: 0, completed: false },
          { text: '报名ACM竞赛', progress: 0, completed: false }
        ],
        created_at: '2024-10-15',
        updated_at: '2024-10-15'
      },
      {
        id: '4',
        title: '英语四级考试',
        description: '通过大学英语四级考试，分数达到550分以上',
        category: 'academic',
        priority: 'high',
        status: 'completed',
        progress: 100,
        target_date: '2024-10-28',
        completion_date: '2024-10-28',
        key_results: [
          { text: '词汇量达到4000+', progress: 100, completed: true },
          { text: '听力练习每日1小时', progress: 100, completed: true },
          { text: '模拟考试达到550分', progress: 100, completed: true }
        ],
        created_at: '2024-08-01',
        updated_at: '2024-10-28'
      }
    ]
    setGoals(mockGoals)
  }

  const filteredGoals = goals.filter(goal => {
    switch (filter) {
      case 'active':
        return goal.status === 'in_progress'
      case 'completed':
        return goal.status === 'completed'
      default:
        return true
    }
  })

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'paused':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Target className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'in_progress':
        return '进行中'
      case 'paused':
        return '已暂停'
      case 'cancelled':
        return '已取消'
      default:
        return '未开始'
    }
  }

  const updateGoalProgress = async (goalId: string, progress: number) => {
    const newStatus = progress === 100 ? 'completed' : 'in_progress'
    const completionDate = progress === 100 ? new Date().toISOString().split('T')[0] : null

    if (studentId) {
      try {
        const { error } = await supabase
          .from('learning_goals')
          .update({ 
            progress, 
            status: newStatus,
            completion_date: completionDate
          })
          .eq('id', goalId)
          .eq('student_id', studentId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating goal:', error)
      }
    }

    // 更新本地状态
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { 
            ...goal, 
            progress, 
            status: newStatus,
            completion_date: completionDate,
            updated_at: new Date().toISOString().split('T')[0]
          }
        : goal
    ))
  }

  const deleteGoal = async (goalId: string) => {
    if (!studentId) {
      console.error('No student ID available')
      alert('无法删除目标：用户信息不完整。请重新登录。')
      return
    }

    const confirmDelete = confirm('确定要删除这个目标吗？此操作无法撤销。')
    if (!confirmDelete) {
      return
    }

    try {
      console.log('Deleting goal:', goalId, 'Student ID:', studentId)
      
      const response = await fetch(`/api/goals?id=${goalId}&student_id=${studentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      console.log('Delete API response:', result)

      if (response.ok && result.success) {
        console.log('Goal deleted from database successfully')
        setGoals(goals.filter(goal => goal.id !== goalId))
        return
      } else {
        throw new Error(result.error || 'API request failed')
      }
    } catch (error: any) {
      console.error('Error deleting goal:', error)
      alert(`删除目标失败：${error?.message || String(error)}`)
    }
  }

  const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Adding goal:', goalData)
    console.log('Student ID:', studentId)
    
    if (!studentId) {
      console.error('No student ID available')
      alert('无法保存目标：用户信息不完整。请重新登录。')
      return
    }

    try {
      const goalToSave = {
        ...goalData,
        student_id: studentId,
        target_date: goalData.target_date || null
      }
      
      console.log('Sending goal to API:', goalToSave)
      
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalToSave)
      })

      const result = await response.json()
      console.log('API response:', result)

      if (response.ok && result.success) {
        console.log('Goal saved to database successfully:', result.data)
        setGoals([result.data, ...goals])
        setShowAddForm(false)
        alert('目标保存成功！')
        return
      } else {
        throw new Error(result.error || 'API request failed')
      }
    } catch (error: any) {
      console.error('Error adding goal:', error)
      alert(`保存目标失败：${error?.message || String(error)}`)
    }

    // 如果数据库保存失败，提供重试选项
    const retryLocal = confirm('数据库保存失败，是否改为本地存储？')
    if (retryLocal) {
      console.log('Using local storage fallback')
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      }
      setGoals([newGoal, ...goals])
      setShowAddForm(false)
    }
  }

  const handleEditGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingGoal) return

    console.log('Editing goal:', goalData)
    console.log('Student ID:', studentId)

    if (!studentId) {
      console.error('No student ID available')
      alert('无法更新目标：用户信息不完整。请重新登录。')
      return
    }

    try {
      const goalToUpdate = {
        ...goalData,
        student_id: studentId,
        target_date: goalData.target_date || null
      }

      console.log('Sending updated goal to API:', goalToUpdate)

      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...goalToUpdate,
          id: editingGoal.id
        })
      })

      const result = await response.json()
      console.log('API response:', result)

      if (response.ok && result.success) {
        console.log('Goal updated in database successfully:', result.data)
        setGoals(goals.map(goal => 
          goal.id === editingGoal.id ? result.data : goal
        ))
        setEditingGoal(null)
        return
      } else {
        throw new Error(result.error || 'API request failed')
      }
    } catch (error: any) {
      console.error('Error updating goal:', error)
      alert(`更新目标失败：${error?.message || String(error)}`)
    }

    // 如果数据库更新失败，提供重试选项
    const retryLocal = confirm('数据库更新失败，是否改为本地更新？')
    if (retryLocal) {
      console.log('Using local storage fallback')
      const updatedGoal: Goal = {
        ...goalData,
        id: editingGoal.id,
        created_at: editingGoal.created_at,
        updated_at: new Date().toISOString().split('T')[0]
      }
      setGoals(goals.map(goal => 
        goal.id === editingGoal.id ? updatedGoal : goal
      ))
      setEditingGoal(null)
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

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* 头部 - 固定不滚动 */}
      <div className="flex-shrink-0 p-6 border-b">
        {/* 第一行：标题和按钮 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">OKR管理</h3>
              <p className="text-sm text-gray-500">设定和追踪您的学习目标与关键结果</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增OKR
            </button>
            <Link href="/goals">
              <button className="inline-flex items-center px-4 py-2 bg-white text-orange-600 text-sm font-medium rounded-md border border-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                查看全部
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </Link>
          </div>
        </div>

        {/* 第二行：过滤器和统计 - 放在同一行以节省空间 */}
        <div className="flex items-center justify-between">
          {/* 过滤器 */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'active', label: '进行中' },
              { key: 'completed', label: '已完成' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === key
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 目标统计 */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{goals.length}</div>
              <div className="text-xs text-gray-600">总目标</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {goals.filter(g => g.status === 'in_progress').length}
              </div>
              <div className="text-xs text-blue-600">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {goals.filter(g => g.status === 'completed').length}
              </div>
              <div className="text-xs text-green-600">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) || 0}%
              </div>
              <div className="text-xs text-orange-600">平均进度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 目标列表 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(goal.status)}
                  <h4 className="text-lg font-medium text-gray-900">{goal.title}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORIES[goal.category].color}`}>
                    {CATEGORIES[goal.category].name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITIES[goal.priority].color}`}>
                    {PRIORITIES[goal.priority].name}优先级
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{goal.description}</p>

                {/* OKR关键结果显示 */}
                {goal.key_results && goal.key_results.some(kr => kr.text.trim()) && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">关键结果:</h5>
                    <div className="space-y-2">
                      {goal.key_results
                        .filter(kr => kr.text.trim())
                        .map((kr, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-500 w-6">KR{index + 1}:</span>
                            <span className="flex-1 text-gray-700">{kr.text}</span>
                            <div className="flex items-center space-x-1">
                              {kr.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  <div 
                                    className="w-2 h-2 rounded-full bg-blue-500"
                                    style={{ opacity: kr.progress / 100 }}
                                  />
                                </div>
                              )}
                              <span className="text-xs text-gray-500 w-8">{kr.progress}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>状态: {getStatusText(goal.status)}</span>
                  {goal.target_date && (
                    <span>目标日期: {new Date(goal.target_date).toLocaleDateString()}</span>
                  )}
                  <span>更新: {new Date(goal.updated_at).toLocaleDateString()}</span>
                </div>

                {/* 进度条 */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">完成进度</span>
                    <span className="font-medium text-gray-900">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        goal.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* 进度调整滑块 */}
                  {goal.status !== 'completed' && goal.status !== 'cancelled' && (
                    <div className="mt-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                  title="编辑目标"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                  title="删除目标"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredGoals.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有目标</h3>
            <p className="text-gray-500 mb-4">设定您的第一个学习目标，开启成长之路！</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建目标
            </button>
          </div>
        )}
        </div>
      </div>

      {/* 弹窗组件 - 放在外层容器外面 */}
      {/* 添加目标表单弹窗 */}
      {showAddForm && (
        <AddGoalModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddGoal}
        />
      )}

      {/* 编辑目标表单弹窗 */}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={handleEditGoal}
        />
      )}
    </div>
  )
}

// 添加目标表单组件
function AddGoalModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => void 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    target_date: '',
    progress: 0,
    status: 'not_started' as Goal['status'],
    completion_date: null as string | null,
    key_results: [
      { text: '', progress: 0, completed: false },
      { text: '', progress: 0, completed: false },
      { text: '', progress: 0, completed: false }
    ] as KeyResult[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    if (formData.title.trim()) {
      onSave(formData)
    } else {
      alert('请输入目标标题')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* 弹窗内容区域 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">新增学习目标</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例如：完成机器学习课程"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="描述您的目标细节和期望达到的效果"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标类型
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Goal['category']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {Object.entries(CATEGORIES).map(([key, {name}]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Goal['priority']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {Object.entries(PRIORITIES).map(([key, {name}]) => (
                    <option key={key} value={key}>{name}优先级</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标完成日期
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* OKR关键结果 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键结果 (Key Results)
              </label>
              <div className="space-y-3">
                {formData.key_results.map((kr, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-8">KR{index + 1}:</span>
                    <input
                      type="text"
                      value={kr.text}
                      onChange={(e) => {
                        const newKeyResults = [...formData.key_results]
                        newKeyResults[index] = { ...kr, text: e.target.value }
                        setFormData({...formData, key_results: newKeyResults})
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={`输入第${index + 1}个关键结果...`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 关键结果用于衡量目标达成情况，建议设置1-3个具体、可量化的结果
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                创建OKR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 编辑目标表单组件
function EditGoalModal({ 
  goal,
  onClose, 
  onSave 
}: { 
  goal: Goal
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => void 
}) {
  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description,
    category: goal.category,
    priority: goal.priority,
    target_date: goal.target_date || '',
    progress: goal.progress,
    status: goal.status,
    completion_date: goal.completion_date,
    key_results: goal.key_results || [
      { text: '', progress: 0, completed: false },
      { text: '', progress: 0, completed: false },
      { text: '', progress: 0, completed: false }
    ]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Edit form submitted:', formData)
    if (formData.title.trim()) {
      onSave(formData)
    } else {
      alert('请输入目标标题')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">编辑学习目标</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例如：完成机器学习课程"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="描述您的目标细节和期望达到的效果"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标类型
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Goal['category']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {Object.entries(CATEGORIES).map(([key, {name}]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Goal['priority']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {Object.entries(PRIORITIES).map(([key, {name}]) => (
                    <option key={key} value={key}>{name}优先级</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Goal['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="not_started">未开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  完成进度 ({formData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标完成日期
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* OKR关键结果编辑 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键结果 (Key Results)
              </label>
              <div className="space-y-3">
                {formData.key_results.map((kr, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 w-8">KR{index + 1}:</span>
                      <input
                        type="text"
                        value={kr.text}
                        onChange={(e) => {
                          const newKeyResults = [...formData.key_results]
                          newKeyResults[index] = { ...kr, text: e.target.value }
                          setFormData({...formData, key_results: newKeyResults})
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={`输入第${index + 1}个关键结果...`}
                      />
                    </div>
                    {kr.text && (
                      <div className="ml-10 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">进度:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={kr.progress}
                          onChange={(e) => {
                            const newKeyResults = [...formData.key_results]
                            newKeyResults[index] = { ...kr, progress: parseInt(e.target.value), completed: parseInt(e.target.value) === 100 }
                            setFormData({...formData, key_results: newKeyResults})
                          }}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-600 w-10">{kr.progress}%</span>
                        <label className="flex items-center text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={kr.completed}
                            onChange={(e) => {
                              const newKeyResults = [...formData.key_results]
                              newKeyResults[index] = { ...kr, completed: e.target.checked, progress: e.target.checked ? 100 : kr.progress }
                              setFormData({...formData, key_results: newKeyResults})
                            }}
                            className="mr-1"
                          />
                          已完成
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 可以调整每个关键结果的完成进度，勾选"已完成"会自动设为100%
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                更新OKR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}