'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testEmailVerification = async () => {
    setIsLoading(true)
    setResult('')
    
    try {
      // 测试重新发送验证邮件
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `https://aio-pro.vercel.app/auth/callback`
        }
      })

      if (error) {
        setResult(`错误: ${error.message}`)
      } else {
        setResult('验证邮件已发送！请检查邮箱。')
      }
    } catch (err) {
      setResult(`异常: ${String(err)}`)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">测试邮箱验证</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入已注册的邮箱"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={testEmailVerification}
            disabled={!email || isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isLoading ? '发送中...' : '重新发送验证邮件'}
          </button>
          
          {result && (
            <div className={`p-4 rounded-md ${
              result.includes('错误') || result.includes('异常') 
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <p>这个页面用于测试邮箱验证功能。</p>
            <p>输入已注册但未验证的邮箱，重新发送验证邮件。</p>
            <p className="mt-2">当前回调URL: <code className="bg-gray-100 px-1 rounded">https://aio-pro.vercel.app/auth/callback</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}