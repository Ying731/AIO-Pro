const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const SUPABASE_URL = 'https://figvgdumgvplzfzihvyt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ3ZnZHVtZ3ZwbHpmemlodnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxMTU3NCwiZXhwIjoyMDcxNDg3NTc0fQ.bGofRgmU6lWblTrb7IcwywlUHl5QPMK_bdWSjqilyjY'

async function createTables() {
  console.log('🌟 开始创建启明星数据库表格...')

  const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 直接执行 SQL 语句创建表格
  const sqlStatements = [
    // 1. 启用扩展
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    
    // 2. 用户档案表
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')) DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 3. 学生信息表
    `CREATE TABLE IF NOT EXISTS students (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 4),
      major TEXT NOT NULL,
      class_name TEXT,
      enrollment_year INTEGER NOT NULL,
      status TEXT CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')) DEFAULT 'active',
      gpa DECIMAL(3,2) DEFAULT 0.0,
      total_credits INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 4. 教师信息表
    `CREATE TABLE IF NOT EXISTS teachers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      research_areas TEXT[],
      office_location TEXT,
      contact_phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 5. 课程表
    `CREATE TABLE IF NOT EXISTS courses (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      credits INTEGER NOT NULL CHECK (credits > 0),
      semester TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      teacher_id UUID REFERENCES teachers(id) NOT NULL,
      max_students INTEGER DEFAULT 50,
      current_students INTEGER DEFAULT 0,
      syllabus_url TEXT,
      status TEXT CHECK (status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 6. 学习目标表
    `CREATE TABLE IF NOT EXISTS learning_goals (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('academic', 'skill', 'project', 'personal', 'career')) DEFAULT 'academic',
      priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
      status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')) DEFAULT 'not_started',
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      target_date DATE,
      completion_date DATE,
      related_course_id UUID REFERENCES courses(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 7. AI智能体状态表
    `CREATE TABLE IF NOT EXISTS ai_agent_states (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      agent_type TEXT CHECK (agent_type IN ('student', 'teacher', 'college')) NOT NULL,
      agent_config JSONB NOT NULL DEFAULT '{}',
      memory_context JSONB DEFAULT '{}',
      preferences JSONB DEFAULT '{}',
      last_interaction TIMESTAMPTZ,
      interaction_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, agent_type)
    );`,

    // 8. 聊天对话表
    `CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      agent_type TEXT CHECK (agent_type IN ('student', 'teacher', 'college')) NOT NULL,
      title TEXT,
      context_data JSONB DEFAULT '{}',
      is_archived BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 9. 聊天消息表
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
      role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      tokens_used INTEGER,
      response_time_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 10. 知识库文档表
    `CREATE TABLE IF NOT EXISTS knowledge_documents (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      document_type TEXT CHECK (document_type IN ('textbook', 'lecture', 'qa', 'manual', 'paper', 'video_transcript')) NOT NULL,
      source_url TEXT,
      author TEXT,
      course_id UUID REFERENCES courses(id),
      upload_user_id UUID REFERENCES profiles(id),
      file_size_bytes INTEGER,
      file_path TEXT,
      is_processed BOOLEAN DEFAULT false,
      is_public BOOLEAN DEFAULT true,
      tags TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 11. 通知表
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      notification_type TEXT CHECK (notification_type IN ('info', 'warning', 'error', 'success', 'reminder')) DEFAULT 'info',
      category TEXT CHECK (category IN ('system', 'course', 'assignment', 'goal', 'ai', 'social')) DEFAULT 'system',
      is_read BOOLEAN DEFAULT false,
      is_important BOOLEAN DEFAULT false,
      action_url TEXT,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 启用 RLS
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE students ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE courses ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE ai_agent_states ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`,

    // RLS 策略
    `CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);`,
    `CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);`,
    `CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`
  ]

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i]
    console.log(`⚡ 执行语句 ${i + 1}/${sqlStatements.length}...`)

    try {
      const { data, error } = await adminSupabase.rpc('exec', {
        sql: sql
      })

      if (error) {
        // 尝试直接使用 SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql })
        })

        if (response.ok) {
          console.log(`✅ 语句 ${i + 1} 执行成功`)
          successCount++
        } else {
          const errorText = await response.text()
          if (errorText.includes('already exists')) {
            console.log(`✅ 语句 ${i + 1} 已存在，跳过`)
            successCount++
          } else {
            console.warn(`⚠️ 语句 ${i + 1}: ${errorText}`)
            errorCount++
          }
        }
      } else {
        console.log(`✅ 语句 ${i + 1} 执行成功`)
        successCount++
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (err) {
      console.error(`❌ 语句 ${i + 1} 失败:`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 执行结果: ${successCount} 成功, ${errorCount} 失败`)

  // 验证表格创建
  const tables = ['profiles', 'students', 'teachers', 'courses', 'learning_goals', 'chat_conversations', 'knowledge_documents']
  console.log('\n🔍 验证表格...')
  
  for (const table of tables) {
    try {
      const { count, error } = await adminSupabase.from(table).select('*', { count: 'exact', head: true })
      if (!error) {
        console.log(`✅ ${table} 表创建成功`)
      }
    } catch (err) {
      console.warn(`⚠️ ${table} 表验证失败`)
    }
  }

  console.log('\n🎉 数据库创建完成！')
  console.log('访问 Dashboard: https://supabase.com/dashboard/project/figvgdumgvplzfzihvyt/editor')
}

createTables().catch(console.error)