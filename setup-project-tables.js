const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing environment variables');
  console.log('Please check .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProjectTables() {
  console.log('Creating projects table...');
  
  // 1. 创建 projects 表
  const { error: projectsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        duration_weeks INTEGER,
        max_students INTEGER DEFAULT 1,
        current_students INTEGER DEFAULT 0,
        teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
        semester VARCHAR(50),
        academic_year VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `
  });

  if (projectsError) {
    console.error('Error creating projects table:', projectsError);
    return;
  }
  
  console.log('Projects table created successfully');

  // 2. 创建 project_enrollments 表
  const { error: enrollmentsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS project_enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        enrollment_status VARCHAR(20) DEFAULT 'enrolled',
        progress INTEGER DEFAULT 0,
        final_grade DECIMAL(5,2),
        letter_grade VARCHAR(5),
        enrollment_date DATE DEFAULT CURRENT_DATE,
        completion_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(student_id, project_id)
      );
    `
  });

  if (enrollmentsError) {
    console.error('Error creating project_enrollments table:', enrollmentsError);
    return;
  }
  
  console.log('Project enrollments table created successfully');
  console.log('All tables created successfully!');
}

createProjectTables();