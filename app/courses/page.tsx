'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, ArrowLeft, Users, Clock, Star, Play, CheckCircle, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Course {
  id: string
  name: string
  code: string
  description: string
  credits: number
  semester: string
  academic_year: string
  teacher_id: string
  max_students: number
  current_students: number
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

interface Enrollment {
  id: string
  enrollment_status: string
  final_grade?: number
  letter_grade?: string
  enrollment_date: string
  course_id: string
  courses?: Course
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
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
        await loadStudentCourses(user.id)
      } else {
        await loadAllCourses()
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
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
        setCourses(data)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadStudentCourses = async (userId: string) => {
    try {
      // 获取学生信息
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!student) {
        // 如果没有学生记录，加载所有可用课程
        await loadAllCourses()
        return
      }

      // 获取学生的选课记录
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
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

      // 同时加载所有可用课程
      await loadAllCourses()

    } catch (error) {
      console.error('Error loading student courses:', error)
    }
  }

  const enrollInCourse = async (courseId: string) => {
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
        .from('enrollments')
        .insert({
          student_id: student.id,
          course_id: courseId,
          enrollment_status: 'enrolled'
        })

      if (error) {
        if (error.code === '23505') {
          alert('您已经选择了这门课程')
        } else {
          alert('选课失败：' + error.message)
        }
      } else {
        alert('选课成功！')
        await loadStudentCourses(user.id)
      }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      alert('选课失败，请重试')
    }
  }

  const getAvailableCourses = () => {
    const enrolledCourseIds = enrollments.map(e => e.course_id)
    return courses.filter(course => !enrolledCourseIds.includes(course.id))
  }

  const getEnrolledCourses = () => {
    return enrollments.filter(e => e.enrollment_status === 'enrolled')
  }

  const getCompletedCourses = () => {
    return enrollments.filter(e => e.enrollment_status === 'completed')
  }

  const CourseCard = ({ course, enrollment }: { course: Course, enrollment?: Enrollment }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
              <p className="text-sm text-gray-500">{course.code} • {course.credits} 学分</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">{course.description}</p>
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
            {course.current_students}/{course.max_students}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {course.semester}
          </div>
        </div>
        {course.teachers?.profiles?.full_name && (
          <span>{course.teachers.profiles.full_name}</span>
        )}
      </div>

      {enrollment && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>选课时间: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
            {enrollment.final_grade && (
              <span className="font-medium">成绩: {enrollment.letter_grade} ({enrollment.final_grade})</span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        {!enrollment ? (
          <button
            onClick={() => enrollInCourse(course.id)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            选择课程
          </button>
        ) : enrollment.enrollment_status === 'enrolled' ? (
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            进入学习
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
          <p className="text-gray-500">加载课程中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
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
                    {userRole === 'student' ? '我的课程' : '课程管理'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {userRole === 'student' ? '学习进度追踪与课程管理' : '课程信息管理'}
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
                  { key: 'enrolled', label: '已选课程', count: getEnrolledCourses().length },
                  { key: 'available', label: '可选课程', count: getAvailableCourses().length },
                  { key: 'completed', label: '已完成', count: getCompletedCourses().length }
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

            {/* 课程网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'available' && getAvailableCourses().map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
              {activeTab === 'enrolled' && getEnrolledCourses().map(enrollment => (
                <CourseCard 
                  key={enrollment.id} 
                  course={enrollment.courses!} 
                  enrollment={enrollment}
                />
              ))}
              {activeTab === 'completed' && getCompletedCourses().map(enrollment => (
                <CourseCard 
                  key={enrollment.id} 
                  course={enrollment.courses!} 
                  enrollment={enrollment}
                />
              ))}
            </div>

            {/* 空状态 */}
            {(
              (activeTab === 'available' && getAvailableCourses().length === 0) ||
              (activeTab === 'enrolled' && getEnrolledCourses().length === 0) ||
              (activeTab === 'completed' && getCompletedCourses().length === 0)
            ) && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'available' && '暂无可选课程'}
                  {activeTab === 'enrolled' && '还未选择任何课程'}
                  {activeTab === 'completed' && '还没有完成的课程'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'available' && '请稍后再来查看'}
                  {activeTab === 'enrolled' && '浏览可选课程开始学习吧'}
                  {activeTab === 'completed' && '完成课程后将在这里显示'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* 教师/管理员视图 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}