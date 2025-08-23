'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function SimpleAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('开始处理验证回调...')
        
        // 使用 Supabase 的内置方法处理验证回调
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          setStatus('error')
          setMessage('验证失败：' + error.message)
          return
        }

        if (data.session && data.session.user) {
          console.log('验证成功，用户:', data.session.user.email)
          
          // 创建用户档案
          try {
            const profileResponse = await fetch('/api/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.session.user.id,
                email: data.session.user.email,
                fullName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '用户',
                role: data.session.user.user_metadata?.role || 'student',
                ...data.session.user.user_metadata
              })
            })

            if (profileResponse.ok) {
              console.log('用户档案创建成功')
              setStatus('success')
              setMessage('邮箱验证成功！正在跳转到登录页面...')
              
              setTimeout(() => {
                router.push('/?verified=true')
              }, 2000)
            } else {
              console.log('用户档案创建失败，但验证成功')
              setStatus('success')
              setMessage('邮箱验证成功！正在跳转到登录页面...')
              
              setTimeout(() => {
                router.push('/?verified=true')
              }, 2000)
            }
          } catch (profileError) {
            console.error('创建档案时出错:', profileError)
            setStatus('success')
            setMessage('邮箱验证成功！正在跳转到登录页面...')
            
            setTimeout(() => {
              router.push('/?verified=true')
            }, 2000)
          }
        } else {
          console.log('未找到有效会话')
          setStatus('error')
          setMessage('验证失败：未找到有效的用户会话')
        }
      } catch (error) {
        console.error('验证回调处理失败:', error)
        setStatus('error')
        setMessage('验证失败：' + String(error))
      }
    }

    handleCallback()
  }, [router])

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
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                返回登录页面
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                重新注册
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}