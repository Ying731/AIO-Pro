'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TrendingUp, Calendar, Clock, Target, Award, BarChart3, PieChart, Activity, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface LearningStats {
  totalStudyTime: number
  completedGoals: number
  totalGoals: number
  averageProgress: number
  coursesEnrolled: number
  coursesCompleted: number
  weeklyActivity: number[]
  goalsByCategory: { [key: string]: number }
  recentActivities: any[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<LearningStats>({
    totalStudyTime: 0,
    completedGoals: 0,
    totalGoals: 0,
    averageProgress: 0,
    coursesEnrolled: 0,
    coursesCompleted: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    goalsByCategory: {},
    recentActivities: []
  })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }
      
      setUser(user)
      await loadLearningStats(user.id)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLearningStats = async (userId: string) => {
    try {
      // 获取学生信息
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!student) {
        // 如果没有学生记录，使用模拟数据
        setStats({
          totalStudyTime: 45.5,
          completedGoals: 3,
          totalGoals: 8,
          averageProgress: 67,
          coursesEnrolled: 5,
          coursesCompleted: 2,
          weeklyActivity: [2.5, 4.2, 3.8, 5.1, 4.6, 3.2, 2.9],
          goalsByCategory: {
            'academic': 4,
            'skill': 2,
            'project': 1,
            'personal': 1
          },
          recentActivities: [
            { type: 'goal_update', description: '更新学习目标进度', time: '2小时前' },
            { type: 'course_view', description: '查看数据结构课程', time: '4小时前' },
            { type: 'ai_chat', description: '与AI助手讨论学习计划', time: '1天前' },
            { type: 'assignment_submit', description: '提交算法作业', time: '2天前' }
          ]
        })
        return
      }

      // 获取学习目标统计
      const { data: goals, error: goalsError } = await supabase
        .from('learning_goals')
        .select('status, category, progress')
        .eq('student_id', student.id)

      let goalStats = {
        totalGoals: 0,
        completedGoals: 0,
        averageProgress: 0,
        goalsByCategory: {} as { [key: string]: number }
      }

      if (!goalsError && goals) {
        goalStats.totalGoals = goals.length
        goalStats.completedGoals = goals.filter(g => g.status === 'completed').length
        goalStats.averageProgress = goals.reduce((sum, g) => sum + g.progress, 0) / (goals.length || 1)
        
        // 按类别统计
        goals.forEach(goal => {
          goalStats.goalsByCategory[goal.category] = (goalStats.goalsByCategory[goal.category] || 0) + 1
        })
      }

      // 获取选课统计
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('enrollment_status')
        .eq('student_id', student.id)

      let courseStats = {
        coursesEnrolled: 0,
        coursesCompleted: 0
      }

      if (!enrollmentsError && enrollments) {
        courseStats.coursesEnrolled = enrollments.length
        courseStats.coursesCompleted = enrollments.filter(e => e.enrollment_status === 'completed').length
      }

      // 模拟学习时间和活动数据
      const mockWeeklyActivity = [2.5, 4.2, 3.8, 5.1, 4.6, 3.2, 2.9]
      const mockRecentActivities = [
        { type: 'goal_update', description: '更新学习目标进度', time: '2小时前' },
        { type: 'course_view', description: '查看课程内容', time: '4小时前' },
        { type: 'ai_chat', description: '与AI助手讨论问题', time: '1天前' }
      ]

      setStats({
        totalStudyTime: 45.5,
        ...goalStats,
        ...courseStats,
        weeklyActivity: mockWeeklyActivity,
        recentActivities: mockRecentActivities
      })

    } catch (error) {
      console.error('Error loading learning stats:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'goal_update': return <Target className="w-4 h-4 text-green-500" />
      case 'course_view': return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'ai_chat': return <Activity className="w-4 h-4 text-purple-500" />
      case 'assignment_submit': return <Award className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const categoryColors = {
    'academic': 'bg-blue-500',
    'skill': 'bg-green-500', 
    'project': 'bg-purple-500',
    'personal': 'bg-yellow-500',
    'career': 'bg-red-500'
  }

  const categoryNames = {
    'academic': '学业目标',
    'skill': '技能提升',
    'project': '项目实践', 
    'personal': '个人发展',
    'career': '职业规划'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载学习分析中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-orange-600 mr-6">
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回仪表板
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">学习分析</h1>
                  <p className="text-sm text-gray-500">个人学习进度与数据分析</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudyTime}h</h3>
                <p className="text-sm text-gray-500">总学习时长</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.completedGoals}/{stats.totalGoals}
                </h3>
                <p className="text-sm text-gray-500">完成目标</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.coursesEnrolled}
                </h3>
                <p className="text-sm text-gray-500">在读课程</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{Math.round(stats.averageProgress)}%</h3>
                <p className="text-sm text-gray-500">平均进度</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 学习活动趋势 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">学习活动趋势</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats.weeklyActivity.map((hours, index) => {
                const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                const maxHours = Math.max(...stats.weeklyActivity)
                const percentage = (hours / maxHours) * 100
                
                return (
                  <div key={index} className="flex items-center">
                    <span className="w-8 text-sm text-gray-600">{days[index]}</span>
                    <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-12 text-sm text-gray-900 text-right">{hours}h</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 目标分类分布 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">目标分类分布</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {Object.entries(stats.goalsByCategory).map(([category, count]) => {
                const total = Object.values(stats.goalsByCategory).reduce((sum, c) => sum + c, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]} mr-3`}></div>
                      <span className="text-sm text-gray-700">{categoryNames[category as keyof typeof categoryNames]}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{Math.round(percentage)}%</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">最近活动</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mr-3">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 学习建议 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">个性化学习建议</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 您本周的学习时长比上周增加了15%，保持良好的学习节奏！</p>
                <p>• 建议重点关注"技能提升"类目标，当前完成率较低</p>
                <p>• 可以尝试与AI助手讨论学习计划，获得更个性化的指导</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}