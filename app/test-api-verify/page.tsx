'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestApiVerifyPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testRegistration = async () => {
    if (!email) {
      setMessage('请输入邮箱地址')
      return
    }

    setIsLoading(true)
    setMessage('正在测试...')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'test123456',
          fullName: 'API验证测试用户',
          role: 'student',
          studentId: 'API001'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`注册成功！请检查邮箱 ${email} 中的验证链接。\n\n验证链接现在应该指向: /api/verify-email\n\n这个方法使用服务器端API处理验证，完全避免客户端fetch请求。`)
      } else {
        setMessage(`注册失败：${data.error || '未知错误'}`)
      }
    } catch (error) {
      setMessage(`请求错误：${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">API验证测试</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">测试邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="your@email.com"
            />
          </div>
          
          <button
            onClick={testRegistration}
            disabled={isLoading}
            className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isLoading ? '处理中...' : '测试API验证'}
          </button>
          
          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded whitespace-pre-line">
              {message}
            </div>
          )}
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-medium text-yellow-800 mb-2">API验证说明：</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 创建了专门的API端点处理邮件验证</li>
              <li>• 完全在服务器端处理验证和用户档案创建</li>
              <li>• 避免了客户端fetch请求可能导致的错误</li>
              <li>• 验证成功后直接重定向到登录页面</li>
            </ul>
          </div>
          
          <div className="mt-4">
            <Link href="/" className="text-blue-500 hover:underline">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}