'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 从URL参数中获取验证信息
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('Callback params:', { code, error, errorDescription })

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(`验证失败：${errorDescription || error}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('验证失败：缺少验证码')
          return
        }

        // 使用验证码交换会话
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          setStatus('error')
          setMessage('验证失败：' + exchangeError.message)
          return
        }

        if (data?.user) {
          console.log('User verified successfully:', data.user.email)
          
          // 创建用户档案记录（如果不存在）
          const { error: profileError } = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.user.email,
              password: 'temp-password', // 不会被使用
              fullName: data.user.user_metadata?.full_name || data.user.email,
              role: data.user.user_metadata?.role || 'student',
              ...data.user.user_metadata
            })
          }).then(res => res.ok ? null : res.json())

          setStatus('success')
          setMessage('邮箱验证成功！正在跳转到登录页面...')
          
          // 3秒后跳转到登录页面
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          setStatus('error')
          setMessage('验证失败：未返回用户信息')
        }
      } catch (err) {
        console.error('Callback handling error:', err)
        setStatus('error')
        setMessage('验证过程中出现错误：' + String(err))
      }
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