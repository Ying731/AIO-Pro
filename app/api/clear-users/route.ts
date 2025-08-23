import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('开始清理所有用户数据...')

    // 1. 获取所有用户
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json(
        { error: '获取用户列表失败：' + usersError.message },
        { status: 400 }
      )
    }

    console.log(`找到 ${users.users.length} 个用户`)

    // 2. 删除所有用户的数据表记录
    const { error: studentsError } = await supabaseAdmin
      .from('students')
      .delete()
      .neq('id', 'impossible-id') // 删除所有记录

    const { error: teachersError } = await supabaseAdmin
      .from('teachers')
      .delete()
      .neq('id', 'impossible-id')

    const { error: profilesError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .neq('id', 'impossible-id')

    console.log('数据表清理完成')

    // 3. 删除所有认证用户
    let deletedCount = 0
    const errors = []

    for (const user of users.users) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (error) {
          errors.push(`删除用户 ${user.email} 失败: ${error.message}`)
        } else {
          deletedCount++
          console.log(`删除用户: ${user.email}`)
        }
      } catch (err) {
        errors.push(`删除用户 ${user.email} 异常: ${String(err)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `清理完成！删除了 ${deletedCount} 个用户`,
      details: {
        totalUsers: users.users.length,
        deletedUsers: deletedCount,
        errors: errors,
        tablesCleared: {
          students: !studentsError,
          teachers: !teachersError,
          profiles: !profilesError
        }
      }
    })

  } catch (error) {
    console.error('Clear users API error:', error)
    return NextResponse.json(
      { error: '清理失败：' + String(error) },
      { status: 500 }
    )
  }
}