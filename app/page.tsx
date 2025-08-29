'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { clearAuthStorage, handleAuthError, checkAuthState } from '@/lib/auth-helpers'
import { GraduationCap, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import VersionDisplay from '@/components/VersionDisplay'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('verified') === 'true') {
      setSuccessMessage('邮箱验证成功！现在您可以登录了。')
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (urlParams.get('error') === 'session_expired') {
      setError('会话已过期，请重新登录')
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // 检查当前用户状态
    const initAuth = async () => {
      try {
        const session = await checkAuthState()
        if (session?.user) {
          // 如果用户已登录，重定向到仪表板
          window.location.href = '/dashboard'
        }
      } catch (error) {
        console.log('Auth initialization error:', error)
      }
    }
    
    initAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // 首先清理任何旧的会话
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        await handleAuthError(error)
        // 处理特定的错误类型
        if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
          throw new Error('邮箱未验证，请检查您的邮箱并点击验证链接后再登录')
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('邮箱或密码错误，请检查后重试')
        }
        throw new Error(error.message)
      }
      
      if (data?.user && data?.session) {
        console.log('Login successful, redirecting...')
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearStorage = async () => {
    setIsClearing(true)
    setError('')
    setSuccessMessage('')
    
    try {
      await clearAuthStorage()
      setSuccessMessage('已清理所有认证数据，请重新登录')
      
      // 清空表单
      setEmail('')
      setPassword('')
    } catch (error) {
      console.error('Clear storage error:', error)
      setError('清理数据时出错，请刷新页面重试')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">启明星学习平台</h1>
            <p className="text-gray-600 mt-2">使用您的学校邮箱登录</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@hbnu.edu.cn"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isClearing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>

            {/* 清理存储按钮 */}
            <button
              type="button"
              onClick={handleClearStorage}
              disabled={isLoading || isClearing}
              className="w-full mt-2 bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isClearing ? 'animate-spin' : ''}`} />
              {isClearing ? '清理中...' : '遇到登录问题？点击清理数据'}
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
                立即注册
              </Link>
            </p>
          </div>

          {/* 测试说明 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">演示说明</h3>
            <p className="text-sm text-gray-600">
              这是启明星AI学习平台的演示版本。目前展示登录界面和基础架构。
              后续将集成完整的AI智能体功能。
            </p>
          </div>
        </div>
      </div>
      
      {/* 版本显示组件 */}
      <VersionDisplay />
    </div>
  )
}