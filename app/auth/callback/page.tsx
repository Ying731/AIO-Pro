'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 从URL参数中获取验证信息
        const code = searchParams.get('code')
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const type = searchParams.get('type')

        console.log('Callback params:', { code, access_token, type, error, errorDescription })

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(`验证失败：${errorDescription || error}`)
          return
        }

        // 处理不同类型的验证回调
        if (code) {
          // 使用authorization code流程
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setStatus('error')
            setMessage('验证失败：' + exchangeError.message)
            return
          }

          if (data?.user) {
            console.log('User verified successfully:', data.user.email)
            await handleSuccessfulAuth(data.user)
            return
          }
        }

        // 处理直接token验证
        if (access_token && refresh_token) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('验证失败：' + sessionError.message)
            return
          }

          if (data?.user) {
            console.log('User verified successfully:', data.user.email)
            await handleSuccessfulAuth(data.user)
            return
          }
        }

        // 如果没有找到验证参数
        setStatus('error')
        setMessage('验证失败：缺少有效的验证信息')
        
      } catch (err) {
        console.error('Callback handling error:', err)
        setStatus('error')
        setMessage('验证过程中出现错误：' + String(err))
      }
    }

    const handleSuccessfulAuth = async (user: any) => {
      // 只有邮箱验证成功后才创建用户档案记录
      console.log('Email verified successfully, creating user profile...', user)
      
      try {
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '用户',
            role: user.user_metadata?.role || 'student',
            ...user.user_metadata
          })
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Profile creation failed:', result)
          setStatus('error')
          setMessage('验证成功但档案创建失败：' + (result.error || '未知错误'))
          return
        }

        console.log('Profile created successfully:', result)
        setStatus('success')
        setMessage('邮箱验证成功！用户档案已创建，正在跳转到登录页面...')
        
      } catch (error) {
        console.error('Profile creation error:', error)
        setStatus('error')
        setMessage('验证成功但档案创建出错：' + String(error))
        return
      }
      
      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/?verified=true')
      }, 3000)
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">验证中...</h1>
            <p className="text-gray-600">正在验证您的邮箱地址，请稍候</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">验证成功！</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="animate-pulse">
              <p className="text-sm text-blue-600">正在跳转...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">验证失败</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回登录页面
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">加载中...</h1>
          <p className="text-gray-600">正在处理您的请求，请稍候</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}