'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestSimplePage() {
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
          fullName: '测试用户',
          role: 'student',
          studentId: 'TEST001'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage(`注册成功！请检查邮箱 ${email} 中的验证链接。`)
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
        <h1 className="text-2xl font-bold mb-6">简化测试页面</h1>
        
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
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '处理中...' : '测试注册'}
          </button>
          
          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              {message}
            </div>
          )}
          
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