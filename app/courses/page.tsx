'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, ArrowLeft, Users, Clock, Star, Play, CheckCircle, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  code: string
  description: string
  type: string
  difficulty: string
  duration_weeks: number
  max_students: number
  current_students: number
  teacher_id: string
  semester: string
  academic_year: string
  status: string
  teachers?: {
    user_id: string
    department: string
    title: string
    profiles?: {
      full_name: string
    }
  }
}

interface ProjectEnrollment {
  id: string
  enrollment_status: string
  progress: number
  final_grade?: number
  letter_grade?: string
  enrollment_date: string
  completion_date?: string
  project_id: string
  projects?: Project
}

export default function CoursesPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [enrollments, setEnrollments] = useState<ProjectEnrollment[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled' | 'completed'>('enrolled')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/'
        return
      }
      
      setUser(user)
      setUserRole(user.user_metadata?.role || 'student')
      
      if (user.user_metadata?.role === 'student') {
        await loadStudentProjects(user.id)
      } else {
        await loadAllProjects()
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          teachers (
            user_id,
            department,
            title,
            profiles (
              full_name
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProjects(data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadStudentProjects = async (userId: string) => {
    try {
      // 获取学生信息
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!student) {
        // 如果没有学生记录，加载所有可用项目
        await loadAllProjects()
        return
      }

      // 获取学生的项目参与记录
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('project_enrollments')
        .select(`
          *,
          projects (
            *,
            teachers (
              user_id,
              department,
              title,
              profiles (
                full_name
              )
            )
          )
        `)
        .eq('student_id', student.id)
        .order('enrollment_date', { ascending: false })

      if (!enrollmentError && enrollmentData) {
        setEnrollments(enrollmentData)
      }

      // 同时加载所有可用项目
      await loadAllProjects()

    } catch (error) {
      console.error('Error loading student projects:', error)
    }
  }

  const enrollInProject = async (projectId: string) => {
    if (!user) return

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        alert('请先完善学生信息')
        return
      }

      const { error } = await supabase
        .from('project_enrollments')
        .insert({
          student_id: student.id,
          project_id: projectId,
          enrollment_status: 'enrolled'
        })

      if (error) {
        if (error.code === '23505') {
          alert('您已经参与了这个项目')
        } else {
          alert('参与项目失败：' + error.message)
        }
      } else {
        alert('参与项目成功！')
        await loadStudentProjects(user.id)
      }
    } catch (error) {
      console.error('Error enrolling in project:', error)
      alert('参与项目失败，请重试')
    }
  }

  const getAvailableProjects = () => {
    const enrolledProjectIds = enrollments.map(e => e.project_id)
    return projects.filter(project => !enrolledProjectIds.includes(project.id))
  }

  const getEnrolledProjects = () => {
    return enrollments.filter(e => e.enrollment_status === 'enrolled')
  }

  const getCompletedProjects = () => {
    return enrollments.filter(e => e.enrollment_status === 'completed')
  }

  const ProjectCard = ({ project, enrollment }: { project: Project, enrollment?: ProjectEnrollment }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-500">{project.code} • {project.type} • {project.difficulty}</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">{project.description}</p>
        </div>
        {enrollment?.enrollment_status === 'completed' && (
          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            已完成
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {project.current_students}/{project.max_students}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {project.duration_weeks}周
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {project.semester}
          </div>
        </div>
        {project.teachers?.profiles?.full_name && (
          <span>{project.teachers.profiles.full_name}</span>
        )}
      </div>

      {enrollment && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>参与时间: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
            <span>进度: {enrollment.progress}%</span>
          </div>
          {enrollment.final_grade && (
            <div className="mt-2 text-sm">
              <span className="font-medium">成绩: {enrollment.letter_grade} ({enrollment.final_grade})</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        {!enrollment ? (
          <button
            onClick={() => enrollInProject(project.id)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            参与项目
          </button>
        ) : enrollment.enrollment_status === 'enrolled' ? (
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            进入项目
          </button>
        ) : (
          <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md">
            <FileText className="w-4 h-4 mr-2" />
            查看详情
          </button>
        )}

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span>4.8</span>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载项目中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-orange-600 mr-6">
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回仪表板
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {userRole === 'student' ? '我的项目' : '项目管理'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {userRole === 'student' ? '学习进度追踪与项目管理' : '项目信息管理'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {userRole === 'student' ? (
          <>
            {/* 学生视图 - 标签页 */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                {[
                  { key: 'enrolled', label: '已选项目', count: getEnrolledProjects().length },
                  { key: 'available', label: '可选项目', count: getAvailableProjects().length },
                  { key: 'completed', label: '已完成', count: getCompletedProjects().length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* 项目网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'available' && getAvailableProjects().map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {activeTab === 'enrolled' && getEnrolledProjects().map(enrollment => (
                <ProjectCard 
                  key={enrollment.id} 
                  project={enrollment.projects!} 
                  enrollment={enrollment}
                />
              ))}
              {activeTab === 'completed' && getCompletedProjects().map(enrollment => (
                <ProjectCard 
                  key={enrollment.id} 
                  project={enrollment.projects!} 
                  enrollment={enrollment}
                />
              ))}
            </div>

            {/* 空状态 */}
            {(
              (activeTab === 'available' && getAvailableProjects().length === 0) ||
              (activeTab === 'enrolled' && getEnrolledProjects().length === 0) ||
              (activeTab === 'completed' && getCompletedProjects().length === 0)
            ) && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'available' && '暂无可选项目'}
                  {activeTab === 'enrolled' && '还未参与任何项目'}
                  {activeTab === 'completed' && '还没有完成的项目'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'available' && '请稍后再来查看'}
                  {activeTab === 'enrolled' && '浏览可选项目开始参与吧'}
                  {activeTab === 'completed' && '完成项目后将在这里显示'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* 教师/管理员视图 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}