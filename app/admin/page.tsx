'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [email, setEmail] = useState('student1@test.com')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const verifyUser = async () => {
    setLoading(true)
    setResult('验证中...')
    
    try {
      const response = await fetch('/api/verify-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setResult('验证失败: ' + data.error)
        return
      }

      setResult('验证成功! ' + data.message)
      
    } catch (error) {
      setResult('验证失败: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setResult('测试登录中...')
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          password: '123456' // 假设测试密码是123456
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setResult('登录失败: ' + data.error)
        return
      }

      setResult('登录成功! 用户: ' + JSON.stringify(data.user?.email, null, 2))
      
    } catch (error) {
      setResult('登录失败: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  const clearAllUsers = async () => {
    if (!confirm('确定要删除所有用户数据吗？此操作不可恢复！')) {
      return
    }
    
    setLoading(true)
    setResult('清理中...')
    
    try {
      const response = await fetch('/api/clear-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        setResult('清理失败: ' + data.error)
        return
      }

      setResult('清理成功!\n' + JSON.stringify(data, null, 2))
      
    } catch (error) {
      setResult('清理失败: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">用户管理工具</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入要验证的用户邮箱"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={verifyUser}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '验证用户邮箱'}
              </button>
              
              <button
                onClick={testLogin}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '测试登录'}
              </button>
              
              <button
                onClick={clearAllUsers}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '清空所有用户'}
              </button>
            </div>
          </div>
          
          {result && (
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">结果:</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 输入需要验证的用户邮箱地址</li>
            <li>2. 点击"验证用户邮箱"将该用户标记为已验证</li>
            <li>3. 点击"测试登录"验证用户是否能正常登录</li>
            <li>4. 验证成功后用户即可正常登录系统</li>
          </ul>
        </div>
      </div>
    </div>
  )
}