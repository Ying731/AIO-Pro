'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestVerificationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  const testRegistration = async () => {
    setIsLoading(true)
    setMessage('')
    setDebugInfo('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: 'test123456',
          fullName: '测试用户',
          role: 'student',
          studentId: 'TEST001',
          grade: '1',
          major: '软件工程'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage('注册成功！请检查邮箱中的验证链接。')
        setDebugInfo(JSON.stringify(result, null, 2))
      } else {
        setMessage('注册失败：' + result.error)
        setDebugInfo(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      setMessage('请求失败：' + String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const checkEnvironment = async () => {
    try {
      const response = await fetch('/api/check-environment', {
        method: 'GET'
      })
      
      if (response.ok) {
        const result = await response.json()
        setDebugInfo(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      setDebugInfo('环境检查失败：' + String(error))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">验证测试页面</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={testRegistration}
            disabled={isLoading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试注册'}
          </button>

          <button
            onClick={checkEnvironment}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            检查环境变量
          </button>

          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {debugInfo && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded">
              <h3 className="font-medium mb-2">调试信息：</h3>
              <pre className="text-xs overflow-auto">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}