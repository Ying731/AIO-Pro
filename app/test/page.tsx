'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    setResult('测试中...')
    
    try {
      // 测试1: 基础连接
      console.log('Testing Supabase connection...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
      
      if (connectionError) {
        console.error('Connection error:', connectionError)
        setResult('连接错误: ' + JSON.stringify(connectionError, null, 2))
        return
      }
      
      console.log('Connection successful')
      
      // 测试2: 基础认证测试
      const testEmail = 'test@example.com'
      const testPassword = '123456'
      
      console.log('Testing user creation...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: '测试用户',
            role: 'student',
            studentId: '2024001',
            grade: '1',
            major: '软件工程'
          }
        }
      })
      
      if (authError) {
        console.error('Auth error:', authError)
        setResult('认证错误: ' + JSON.stringify(authError, null, 2))
        return
      }
      
      console.log('Auth successful:', authData)
      setResult('测试成功! 用户创建: ' + JSON.stringify(authData.user?.id, null, 2))
      
    } catch (error) {
      console.error('Test error:', error)
      setResult('测试失败: ' + JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const checkDatabaseTables = async () => {
    setLoading(true)
    
    try {
      // 检查各个表的数据
      console.log('Checking profiles table...')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      
      console.log('Checking students table...')  
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .limit(5)
        
      console.log('Checking teachers table...')
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers') 
        .select('*')
        .limit(5)
      
      const results = {
        profiles: { data: profiles, error: profilesError },
        students: { data: students, error: studentsError },
        teachers: { data: teachers, error: teachersError }
      }
      
      console.log('Database check results:', results)
      setResult('数据库检查结果: ' + JSON.stringify(results, null, 2))
      
    } catch (error) {
      console.error('Database check error:', error)
      setResult('数据库检查失败: ' + JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase 连接测试</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testSupabaseConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试用户注册'}
          </button>
          
          <button
            onClick={checkDatabaseTables}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? '检查中...' : '检查数据库表'}
          </button>
        </div>
        
        {result && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果:</h2>
            <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}