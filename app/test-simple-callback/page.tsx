'use client'

import { useState } from 'react'

export default function TestSimpleCallbackPage() {
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testSimpleRegistration = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'test123456',
          fullName: '测试用户简化版',
          role: 'student',
          studentId: 'SIMPLE001',
          grade: '1',
          major: '软件工程'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage(`注册成功！验证邮件已发送到 ${testEmail}。\n\n请检查邮箱中的验证链接，现在应该指向简化的回调页面：/auth/callback/simple`)
      } else {
        setMessage('注册失败：' + result.error)
      }
    } catch (error) {
      setMessage('请求失败：' + String(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">测试简化验证流程</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              测试邮箱
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={testSimpleRegistration}
            disabled={isLoading || !testEmail}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试简化注册流程'}
          </button>

          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded whitespace-pre-line">
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-medium text-yellow-800 mb-2">修复说明：</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 创建了简化的验证回调页面 /auth/callback/simple</li>
              <li>• 使用更简单的验证逻辑，避免复杂的token处理</li>
              <li>• 修复了fetch请求的URL问题</li>
              <li>• 改进了错误处理和用户体验</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}