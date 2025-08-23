'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestRegisterPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testDirectInsert = async () => {
    setLoading(true)
    setResult('测试直接插入...')
    
    try {
      const testEmail = `test${Date.now()}@example.com`
      const testPassword = '123456'
      const testData = {
        full_name: '测试用户',
        role: 'student',
        studentId: '2024001',
        grade: '1', 
        major: '软件工程'
      }
      
      // 1. 创建 Auth 用户
      console.log('Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { data: testData }
      })
      
      if (authError) {
        console.error('Auth error:', authError)
        setResult('Auth 错误: ' + JSON.stringify(authError, null, 2))
        return
      }
      
      if (!authData.user) {
        setResult('用户创建失败')
        return
      }
      
      console.log('Auth user created:', authData.user.id)
      
      // 2. 等待用户会话建立
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 3. 使用 service role 直接插入（绕过 RLS）
      const supabaseAdmin = supabase
      
      // 插入 profiles
      console.log('Inserting profile...')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: testEmail,
          full_name: testData.full_name,
          role: testData.role
        }])
      
      if (profileError) {
        console.error('Profile error:', profileError)
        setResult('Profile 错误: ' + JSON.stringify(profileError, null, 2))
        return
      }
      
      // 插入 students
      console.log('Inserting student...')
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .insert([{
          user_id: authData.user.id,
          student_id: testData.studentId,
          grade: parseInt(testData.grade),
          major: testData.major,
          class_name: '',
          enrollment_year: new Date().getFullYear(),
          status: 'active',
          gpa: 0.0,
          total_credits: 0
        }])
      
      if (studentError) {
        console.error('Student error:', studentError)
        setResult('Student 错误: ' + JSON.stringify(studentError, null, 2))
        return
      }
      
      setResult('测试成功! 用户ID: ' + authData.user.id + '\n邮箱: ' + testEmail)
      
    } catch (error) {
      console.error('Test error:', error)
      setResult('测试失败: ' + JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const checkRLSPolicies = async () => {
    setLoading(true)
    
    try {
      // 尝试不同的插入方式测试 RLS
      const testUserId = 'test-user-id-' + Date.now()
      
      console.log('Testing RLS policies...')
      
      // 测试 profiles 表插入
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: testUserId,
          email: 'test@example.com',
          full_name: '测试',
          role: 'student'
        }])
      
      setResult('RLS 测试结果: ' + JSON.stringify(profileError, null, 2))
      
    } catch (error) {
      setResult('RLS 测试错误: ' + JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">注册功能测试</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testDirectInsert}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试直接插入方式'}
          </button>
          
          <button
            onClick={checkRLSPolicies}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:opacity-50 ml-4"
          >
            {loading ? '测试中...' : '测试 RLS 策略'}
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