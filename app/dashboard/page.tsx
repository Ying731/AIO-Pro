'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, BookOpen, MessageCircle, Users, LogOut, Database } from 'lucide-react'
import GoalManager from '@/components/GoalManager'
import Link from 'next/link'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    role?: string
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        window.location.href = '/'
        return
      }
      
      setUser(user as User)
    } catch (error) {
      console.error('Error checking user:', error)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const role = user?.user_metadata?.role || 'student'
  const fullName = user?.user_metadata?.full_name || '用户'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 text-lg font-semibold text-gray-900">启明星学习平台</h1>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{fullName}</p>
                <p className="text-xs text-gray-500">
                  {role === 'student' ? '学生' : role === 'teacher' ? '教师' : '管理员'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">欢迎回来，{fullName}！👋</h2>
          <p className="mt-2 text-gray-600">
            {role === 'student' 
              ? '开始您的智能学习之旅' 
              : role === 'teacher'
              ? '管理您的课程和学生'
              : '管理平台和用户'
            }
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* AI学习助手 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">AI学习助手</h3>
                <p className="text-sm text-gray-500">智能问答和学习建议</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/chat">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  开始对话
                </button>
              </Link>
            </div>
          </div>

          {/* 我的课程 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {role === 'student' ? '我的课程' : '课程管理'}
                </h3>
                <p className="text-sm text-gray-500">
                  {role === 'student' ? '查看课程和作业' : '管理课程和学生'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/courses">
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                  {role === 'student' ? '进入课程' : '管理课程'}
                </button>
              </Link>
            </div>
          </div>

          {/* 学习分析 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {role === 'student' ? '学习分析' : '数据分析'}
                </h3>
                <p className="text-sm text-gray-500">
                  {role === 'student' ? '查看学习进度' : '查看教学数据'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/analytics">
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                  查看分析
                </button>
              </Link>
            </div>
          </div>

          {/* 教师专属：知识库管理 */}
          {(role === 'teacher' || role === 'admin') && (
            <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">知识库管理</h3>
                  <p className="text-sm text-gray-500">管理AI助手的知识内容</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/knowledge">
                  <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors">
                    管理知识库
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 学生专属：目标管理 */}
        {role === 'student' && (
          <div className="mb-8">
            <GoalManager />
          </div>
        )}

        {/* 开发状态说明 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🚀 开发进展</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>✅ <strong>已完成:</strong> 用户注册登录、基础界面架构</p>
            <p>🔄 <strong>开发中:</strong> AI智能体集成、RAG知识库、数据可视化</p>
            <p>📋 <strong>待开发:</strong> 课程管理、作业系统、移动端优化</p>
          </div>
        </div>
      </main>
    </div>
  )
}