'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student' as 'student' | 'teacher',
    studentId: '',
    employeeId: '',
    major: '',
    grade: '',
    department: '',
    title: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // 基础验证
    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位')
      setIsLoading(false)
      return
    }

    // 角色特定验证
    if (formData.role === 'student' && !formData.studentId) {
      setError('请填写学号')
      setIsLoading(false)
      return
    }

    if (formData.role === 'teacher' && !formData.employeeId) {
      setError('请填写工号')
      setIsLoading(false)
      return
    }

    try {
      // 使用API路由处理注册（绕过RLS限制）
      const registrationData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        ...(formData.role === 'student' && {
          studentId: formData.studentId,
          grade: formData.grade,
          major: formData.major
        }),
        ...(formData.role === 'teacher' && {
          employeeId: formData.employeeId,
          department: formData.department,
          title: formData.title
        })
      }

      console.log('Registering user via API:', registrationData)

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '注册失败')
      }

      console.log('Registration successful:', result)
      setSuccess(result.message || '注册成功！账户已创建，数据库记录已保存。')
      
      // 清空表单
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'student',
        studentId: '',
        employeeId: '',
        major: '',
        grade: '',
        department: '',
        title: ''
      })
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 返回登录 */}
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回登录
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">加入启明星</h1>
            <p className="text-gray-600 mt-2">创建您的学习账户</p>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本信息 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="请输入您的姓名"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@hbnu.edu.cn"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 角色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                身份
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">学生</option>
                <option value="teacher">教师</option>
              </select>
            </div>

            {/* 学生特有字段 */}
            {formData.role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学号
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="2024001"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年级
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">选择年级</option>
                      <option value="1">一年级</option>
                      <option value="2">二年级</option>
                      <option value="3">三年级</option>
                      <option value="4">四年级</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专业
                  </label>
                  <select
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择专业</option>
                    <option value="软件工程">软件工程</option>
                    <option value="计算机科学与技术">计算机科学与技术</option>
                    <option value="数据科学与大数据技术">数据科学与大数据技术</option>
                    <option value="人工智能">人工智能</option>
                  </select>
                </div>
              </>
            )}

            {/* 教师特有字段 */}
            {formData.role === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工号
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="T001"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      部门
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="软件工程系"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      职称
                    </label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">选择职称</option>
                      <option value="助教">助教</option>
                      <option value="讲师">讲师</option>
                      <option value="副教授">副教授</option>
                      <option value="教授">教授</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="至少6位密码"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次输入密码"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '创建账户'}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账户？
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}