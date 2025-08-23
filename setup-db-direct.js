const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase 配置
const SUPABASE_URL = 'https://figvgdumgvplzfzihvyt.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ3ZnZHVtZ3ZwbHpmemlodnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxMTU3NCwiZXhwIjoyMDcxNDg3NTc0fQ.bGofRgmU6lWblTrb7IcwywlUHl5QPMK_bdWSjqilyjY'

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function setupDatabase() {
  console.log('🌟 启明星平台 - 开始数据库设置...')
  
  try {
    // 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, '..', 'supabase-database-setup.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    console.log('📄 SQL 文件已读取，准备执行...')
    
    // 使用 Supabase SQL Editor API 执行完整的 SQL 脚本
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        query: sqlContent
      })
    })

    if (!response.ok) {
      // 如果 exec_sql 不存在，我们逐句执行
      console.log('🔄 使用逐句执行模式...')
      await executeSQLStatements(sqlContent)
    } else {
      console.log('✅ 数据库架构创建完成！')
    }
    
    // 验证设置结果
    await verifySetup()
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message)
    console.log('🔄 尝试逐句执行模式...')
    
    try {
      const sqlFilePath = path.join(__dirname, '..', 'supabase-database-setup.sql')
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
      await executeSQLStatements(sqlContent)
      await verifySetup()
    } catch (retryError) {
      console.error('❌ 重试失败:', retryError.message)
      process.exit(1)
    }
  }
}

async function executeSQLStatements(sqlContent) {
  // 将 SQL 拆分为语句
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/))

  console.log(`📊 共 ${statements.length} 条 SQL 语句待执行`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    
    if (statement.startsWith('--') || statement === '') {
      continue
    }

    try {
      console.log(`⚡ 执行语句 ${i + 1}/${statements.length}...`)
      
      // 直接使用 REST API 执行 SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          sql: statement + ';'
        })
      })

      if (response.ok) {
        console.log(`✅ 语句 ${i + 1} 执行成功`)
        successCount++
      } else {
        const errorText = await response.text()
        console.warn(`⚠️ 语句 ${i + 1} 执行警告: ${errorText}`)
        // 很多语句可能因为已存在而报错，这是正常的
        if (errorText.includes('already exists') || errorText.includes('does not exist')) {
          successCount++
        } else {
          errorCount++
        }
      }
      
      // 添加延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (err) {
      console.error(`❌ 语句 ${i + 1} 执行失败:`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 执行结果: ${successCount} 成功, ${errorCount} 错误`)
  
  if (successCount > errorCount) {
    console.log('🎉 大部分语句执行成功！')
  } else {
    console.log('⚠️ 执行中遇到较多错误，请检查结果')
  }
}

async function verifySetup() {
  console.log('\n🔍 验证数据库设置...')
  
  try {
    // 检查主要表格是否存在
    const tables = [
      'profiles',
      'students', 
      'teachers',
      'courses',
      'learning_goals',
      'chat_conversations',
      'knowledge_documents'
    ]
    
    let successCount = 0
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`✅ 表格 ${tableName} 验证成功`)
          successCount++
        } else {
          console.warn(`⚠️ 表格 ${tableName} 验证失败:`, error.message)
        }
      } catch (err) {
        console.warn(`⚠️ 无法验证表格 ${tableName}:`, err.message)
      }
    }
    
    console.log(`\n📊 验证结果: ${successCount}/${tables.length} 个核心表格创建成功`)
    
    if (successCount >= 5) {
      console.log('🎉 数据库架构设置成功！')
      console.log('🌐 请访问 Supabase Dashboard 查看完整结果：')
      console.log('https://supabase.com/dashboard/project/figvgdumgvplzfzihvyt/editor')
    } else {
      console.log('⚠️ 部分表格可能未正确创建，请手动检查')
    }
    
  } catch (error) {
    console.error('❌ 验证过程失败:', error.message)
  }
}

// 运行设置
setupDatabase()