'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Target, ArrowLeft, Plus, Calendar, Flag, BookOpen } from 'lucide-react'
import Link from 'next/link'
import GoalManager from '@/components/GoalManager'

interface Course {
  id: string
  name: string
  code: string
}

export default function GoalsPage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

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
      await loadCourses()
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name')

      if (!error && data) {
        setCourses(data)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
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
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">学习目标管理</h1>
                  <p className="text-sm text-gray-500">设定、追踪和管理您的学习目标</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 目标管理提示 */}
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-900 mb-1">智能目标管理</h3>
              <p className="text-sm text-orange-700">
                设定SMART目标，追踪学习进度，与课程关联，获得个性化学习建议
              </p>
            </div>
          </div>
        </div>

        {/* 快速操作面板 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => setShowAddForm(true)}>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">新增目标</h3>
                <p className="text-sm text-gray-500">设定新的学习目标</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">本周目标</h3>
                <p className="text-sm text-gray-500">查看本周待完成目标</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Flag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">高优先级</h3>
                <p className="text-sm text-gray-500">关注重要紧急目标</p>
              </div>
            </div>
          </div>
        </div>

        {/* 目标管理器组件 */}
        <GoalManager />

        {/* 学习建议面板 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">个性化学习建议</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">目标制定技巧</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 使用SMART原则：具体、可衡量、可达成、相关性、时限性</li>
                <li>• 将大目标分解为小的里程碑</li>
                <li>• 定期回顾和调整目标进度</li>
                <li>• 关联相关课程，形成学习闭环</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">进度管理建议</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 每日更新学习进度，保持习惯</li>
                <li>• 利用AI助手获得个性化指导</li>
                <li>• 适时调整目标难度和时间安排</li>
                <li>• 庆祝每个里程碑的达成</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}