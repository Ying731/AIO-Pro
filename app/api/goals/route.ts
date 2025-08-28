import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const goalData = await request.json()
    
    console.log('Creating goal with data:', goalData)

    if (!goalData.student_id) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    // 验证学生记录是否存在
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', goalData.student_id)
      .single()

    if (studentError || !student) {
      console.error('Student not found:', studentError)
      return NextResponse.json(
        { error: '找不到对应的学生记录' },
        { status: 404 }
      )
    }

    // 插入目标记录
    const { data: newGoal, error: goalError } = await supabaseAdmin
      .from('learning_goals')
      .insert([{
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        status: goalData.status || 'not_started',
        progress: goalData.progress || 0,
        target_date: goalData.target_date,
        completion_date: goalData.completion_date,
        key_results: goalData.key_results || [],
        student_id: goalData.student_id
      }])
      .select()
      .single()

    if (goalError) {
      console.error('Error creating goal:', goalError)
      return NextResponse.json(
        { error: '创建目标失败：' + goalError.message },
        { status: 500 }
      )
    }

    console.log('Goal created successfully:', newGoal)
    
    return NextResponse.json({
      success: true,
      data: newGoal,
      message: '目标创建成功'
    })

  } catch (error) {
    console.error('Create goal API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const studentId = url.searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    const { data: goals, error } = await supabaseAdmin
      .from('learning_goals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      return NextResponse.json(
        { error: '获取目标失败：' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: goals || [],
      message: '获取目标成功'
    })

  } catch (error) {
    console.error('Get goals API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const goalData = await request.json()
    
    console.log('Updating goal with data:', goalData)

    if (!goalData.id) {
      return NextResponse.json(
        { error: '缺少目标ID' },
        { status: 400 }
      )
    }

    if (!goalData.student_id) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    // 验证目标是否存在且属于该学生
    const { data: existingGoal, error: checkError } = await supabaseAdmin
      .from('learning_goals')
      .select('id, student_id')
      .eq('id', goalData.id)
      .eq('student_id', goalData.student_id)
      .single()

    if (checkError || !existingGoal) {
      console.error('Goal not found or not owned by student:', checkError)
      return NextResponse.json(
        { error: '找不到对应的目标记录或无权限修改' },
        { status: 404 }
      )
    }

    // 更新目标记录
    const { data: updatedGoal, error: updateError } = await supabaseAdmin
      .from('learning_goals')
      .update({
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        status: goalData.status,
        progress: goalData.progress,
        target_date: goalData.target_date,
        completion_date: goalData.completion_date,
        key_results: goalData.key_results || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', goalData.id)
      .eq('student_id', goalData.student_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating goal:', updateError)
      return NextResponse.json(
        { error: '更新目标失败：' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Goal updated successfully:', updatedGoal)
    
    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: '目标更新成功'
    })

  } catch (error) {
    console.error('Update goal API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const goalId = url.searchParams.get('id')
    const studentId = url.searchParams.get('student_id')
    
    console.log('Deleting goal with id:', goalId, 'student_id:', studentId)

    if (!goalId) {
      return NextResponse.json(
        { error: '缺少目标ID' },
        { status: 400 }
      )
    }

    if (!studentId) {
      return NextResponse.json(
        { error: '缺少学生ID' },
        { status: 400 }
      )
    }

    // 验证目标是否存在且属于该学生
    const { data: existingGoal, error: checkError } = await supabaseAdmin
      .from('learning_goals')
      .select('id, student_id')
      .eq('id', goalId)
      .eq('student_id', studentId)
      .single()

    if (checkError || !existingGoal) {
      console.error('Goal not found or not owned by student:', checkError)
      return NextResponse.json(
        { error: '找不到对应的目标记录或无权限删除' },
        { status: 404 }
      )
    }

    // 删除目标记录
    const { error: deleteError } = await supabaseAdmin
      .from('learning_goals')
      .delete()
      .eq('id', goalId)
      .eq('student_id', studentId)

    if (deleteError) {
      console.error('Error deleting goal:', deleteError)
      return NextResponse.json(
        { error: '删除目标失败：' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('Goal deleted successfully:', goalId)
    
    return NextResponse.json({
      success: true,
      message: '目标删除成功'
    })

  } catch (error) {
    console.error('Delete goal API error:', error)
    return NextResponse.json(
      { error: '服务器错误: ' + String(error) },
      { status: 500 }
    )
  }
}