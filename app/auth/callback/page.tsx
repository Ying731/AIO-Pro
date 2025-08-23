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
        const token_type = searchParams.get('token_type')
        const expires_in = searchParams.get('expires_in')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const type = searchParams.get('type')
        
        // inviteUserByEmail 通常使用这些参数
        const token = searchParams.get('token')
        const email = searchParams.get('email')

        // 获取所有URL参数进行调试
        const allParams: { [key: string]: string } = {}
        for (const [key, value] of searchParams.entries()) {
          allParams[key] = value
        }
        console.log('所有URL参数:', allParams)
        console.log('URL完整地址:', window.location.href)
        console.log('关键参数:', { code, access_token, refresh_token, token, email, type, error })

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(`验证失败：${errorDescription || error}`)
          return
        }

        // 尝试不同的验证方法
        let authSuccess = false
        let userData = null

        // 方法1: 处理inviteUserByEmail产生的token
        if (token && !authSuccess) {
          console.log('尝试处理invite token...')
          try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'invite'
            })

            if (!verifyError && data?.user) {
              console.log('使用invite token验证成功')
              userData = data.user
              authSuccess = true
            } else {
              console.log('invite token验证失败:', verifyError)
            }
          } catch (err) {
            console.log('invite token处理异常:', err)
          }
        }

        // 方法2: 如果有access_token，直接设置会话
        if (access_token && refresh_token && !authSuccess) {
          console.log('尝试使用access_token设置会话...')
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token
            })

            if (!sessionError && data?.user) {
              console.log('使用access_token验证成功')
              userData = data.user
              authSuccess = true
            } else {
              console.log('access_token验证失败:', sessionError)
            }
          } catch (err) {
            console.log('access_token处理异常:', err)
          }
        }

        // 方法3: 如果有code，使用exchangeCodeForSession
        if (code && !authSuccess) {
          console.log('尝试使用authorization code...')
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (!exchangeError && data?.user) {
              console.log('使用code验证成功')
              userData = data.user
              authSuccess = true
            } else {
              console.log('code验证失败:', exchangeError)
            }
          } catch (err) {
            console.log('code处理异常:', err)
          }
        }

        if (authSuccess && userData) {
          console.log('验证成功，用户数据:', userData)
          await handleSuccessfulAuth(userData)
        } else {
          console.log('所有验证方法都失败，URL参数:', allParams)
          setStatus('error')
          setMessage(`验证失败：邮箱验证链接格式不正确。\n\n调试信息：${JSON.stringify(allParams, null, 2)}\n\n请联系管理员或重新注册。`)
        }
        
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