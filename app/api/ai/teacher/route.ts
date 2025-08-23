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
    const { message, conversationId, userId } = await request.json()

    // 获取教师档案信息
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // 获取教师信息
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 获取教师的课程信息
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('teacher_id', userId)

    // 获取学生统计数据
    const { data: students } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq('status', 'active')

    // 获取对话历史
    const { data: messageHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 构建教师上下文
    const context = buildTeacherContext(profile, teacher, courses || [], students || [], messageHistory || [])
    
    // 搜索相关知识库内容
    const knowledgeResults = await searchKnowledgeBase(message, userId)
    
    // 生成教师AI响应
    const aiResponse = await generateTeacherAIResponse(message, context, knowledgeResults)

    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Teacher AI API error:', error)
    return NextResponse.json(
      { error: '生成AI回复时出现错误' },
      { status: 500 }
    )
  }
}

function buildTeacherContext(profile: any, teacher: any, courses: any[], students: any[], messageHistory: any[]) {
  const context = {
    teacherName: profile?.full_name || '老师',
    department: teacher?.department || '未知部门',
    title: teacher?.title || '讲师',
    employeeId: teacher?.employee_id || '',
    researchAreas: teacher?.research_areas || [],
    totalCourses: courses?.length || 0,
    totalStudents: students?.length || 0,
    courses: courses?.map(course => ({
      name: course.name,
      code: course.code,
      semester: course.semester,
      credits: course.credits,
      capacity: course.capacity
    })) || [],
    studentStats: {
      totalCount: students?.length || 0,
      averageGPA: students?.length > 0 ? (students.reduce((sum: number, s: any) => sum + s.gpa, 0) / students.length) : 0,
      gradeDistribution: calculateGradeDistribution(students || []),
      majorDistribution: calculateMajorDistribution(students || [])
    },
    recentMessages: messageHistory?.slice(0, 5).reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    })) || []
  }
  
  return context
}

function calculateGradeDistribution(students: any[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 }
  students.forEach(student => {
    if (distribution[student.grade as keyof typeof distribution] !== undefined) {
      distribution[student.grade as keyof typeof distribution]++
    }
  })
  return distribution
}

function calculateMajorDistribution(students: any[]) {
  const distribution: { [key: string]: number } = {}
  students.forEach(student => {
    const major = student.major || '未知专业'
    distribution[major] = (distribution[major] || 0) + 1
  })
  return distribution
}

async function searchKnowledgeBase(query: string, userId: string) {
  try {
    const response = await fetch(`${process.env.APP_URL || 'http://localhost:3003'}/api/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, userId })
    })

    const data = await response.json()
    return data.success ? data.results : []
  } catch (error) {
    console.error('Knowledge search error:', error)
    return []
  }
}

async function generateTeacherAIResponse(message: string, context: any, knowledgeResults: any[] = []): Promise<string> {
  const { teacherName, department, title, totalCourses, totalStudents, courses, studentStats } = context
  const lowerMessage = message.toLowerCase()
  
  // 如果有知识库搜索结果，优先使用
  if (knowledgeResults.length > 0) {
    const topResult = knowledgeResults[0]
    const knowledgeContent = `📚 **相关知识参考：**
**${topResult.title}**
${topResult.content}

*来源：启明星知识库 - ${topResult.category}*

---

基于以上知识和您的教学情况（${department} ${title}，负责${totalCourses}门课程，管理${totalStudents}名学生），我为您提供以下建议：`
    
    // 根据知识库内容生成更精准的回答
    if (topResult.category === '教学方法') {
      return knowledgeContent + `

🎓 **教学实施建议：**
- 结合您的专业领域特点调整教学策略
- 根据学生基础情况个性化教学内容
- 利用现有教学资源提升教学效果

📊 **课程优化方向：**
- 分析当前${totalCourses}门课程的教学数据
- 参考学生平均GPA ${studentStats.averageGPA.toFixed(2)} 调整难度
- 增强师生互动，提升课程参与度

需要我为您分析具体的教学改进方案吗？`
    }
    
    return knowledgeContent + `

希望这些信息对您的教学工作有帮助！如果需要更具体的指导，请随时询问。`
  }
  
  // 教学分析和改进建议
  if (lowerMessage.includes('教学') || lowerMessage.includes('课程') || lowerMessage.includes('改进') || lowerMessage.includes('优化')) {
    return `${teacherName}，根据您的教学情况，我为您提供以下教学分析和改进建议：

📊 **当前教学概况：**
- 授课门数：${totalCourses} 门
- 管理学生：${totalStudents} 名
- 学生平均GPA：${studentStats.averageGPA.toFixed(2)}
- 年级分布：${Object.entries(studentStats.gradeDistribution).map(([grade, count]) => `大${grade}年级${count}人`).join('、')}

🎯 **教学优化建议：**

**课程设计方面：**
- 根据学生基础水平调整课程难度梯度
- 增加实践环节，提升学生动手能力
- 建立完善的课程评价和反馈机制

**学生管理方面：**
- 关注GPA低于平均值的学生，提供针对性辅导
- 建立学习小组，促进同伴互助学习
- 定期进行学业预警和生涯规划指导

**教学方法方面：**
- 采用多元化教学方法（翻转课堂、案例教学等）
- 利用现代信息技术提升教学效率
- 加强课堂互动，提高学生参与度

📈 **数据驱动改进：**
- 定期分析学生成绩分布和学习进度
- 收集学生反馈，持续改进教学内容
- 建立教学效果评估体系

需要我为您制定具体某门课程的改进计划吗？`
  }
  
  // 学生管理相关
  if (lowerMessage.includes('学生') || lowerMessage.includes('管理') || lowerMessage.includes('指导')) {
    const averageGPA = studentStats.averageGPA.toFixed(2)
    return `关于学生管理，根据您当前管理的${totalStudents}名学生情况，我提供以下建议：

👥 **学生整体情况分析：**
- 总人数：${totalStudents} 名
- 平均GPA：${averageGPA}（${parseFloat(averageGPA) >= 3.5 ? '优秀' : parseFloat(averageGPA) >= 3.0 ? '良好' : '需要关注'}）
- 专业分布：${Object.entries(studentStats.majorDistribution).map(([major, count]) => `${major}${count}人`).join('、')}

🎯 **分类管理策略：**

**优秀学生（GPA ≥ 3.5）：**
- 提供更多挑战性项目和研究机会
- 鼓励参与学科竞赛和创新创业活动
- 推荐申请奖学金和荣誉项目

**中等学生（GPA 2.5-3.5）：**
- 制定个性化学习提升计划
- 加强学习方法指导和时间管理培训
- 提供更多实践机会巩固理论知识

**学业预警学生（GPA < 2.5）：**
- 建立一对一辅导机制
- 分析学习困难原因，制定针对性帮扶措施
- 加强与家长沟通，形成教育合力

💡 **管理工作建议：**
- 建立定期谈话制度，了解学生学习和生活状况
- 利用数据分析工具跟踪学生学习进度
- 创建班级或课程微信群，保持及时沟通
- 鼓励学生自我管理和同伴互助

📅 **时间节点提醒：**
- 每月进行学业数据分析
- 期中期末重点关注学业预警学生
- 学期末进行综合评价和规划指导

需要我为您分析具体某个年级或专业学生的管理方案吗？`
  }
  
  // 科研和职业发展
  if (lowerMessage.includes('科研') || lowerMessage.includes('研究') || lowerMessage.includes('发展') || lowerMessage.includes('职业')) {
    return `${teacherName}，关于科研和职业发展，基于您${department}${title}的身份，我为您提供以下建议：

🔬 **科研发展规划：**

**研究方向建设：**
${context.researchAreas.length > 0 ? 
  `- 当前研究领域：${context.researchAreas.join('、')}
- 深化现有研究方向，形成特色优势
- 关注学科前沿动态，寻找创新突破点` :
  `- 建议结合专业背景确定主要研究方向
- 关注学科交叉领域的研究机会
- 积极参与学术会议和研讨活动`
}

**科研能力提升：**
- 加强科研方法论学习和实践
- 提升学术写作和论文发表能力
- 积极申请科研项目和基金资助
- 建立产学研合作关系

🎓 **教学科研结合：**
- 将最新研究成果融入课程教学
- 指导学生参与科研项目实践
- 鼓励学生进行创新创业活动
- 建立教学改革研究项目

👥 **学术合作网络：**
- 与同行专家建立合作关系
- 参与学术组织和专业委员会
- 开展国内外学术交流合作
- 指导青年教师和研究生发展

📈 **职业发展路径：**
- **短期目标（1-2年）：**
  - 完善课程体系建设
  - 发表高质量学术论文
  - 申请教学改革项目

- **中期目标（3-5年）：**
  - 获得更高职称评定
  - 建立稳定的科研团队
  - 承担重要科研项目

- **长期目标（5-10年）：**
  - 成为学科带头人或专业负责人
  - 获得重要学术荣誉和奖项
  - 在行业内具有重要影响力

需要我为您制定更详细的科研发展规划或协助申请项目吗？`
  }
  
  // 默认智能响应
  const responses = [
    `${teacherName}，作为${department}的${title}，您提出了一个很有价值的问题。基于您管理${totalStudents}名学生、授课${totalCourses}门的教学经验...`,
    `这是一个很好的教学管理问题！结合您当前的教学情况和学生平均GPA ${studentStats.averageGPA.toFixed(2)} 的表现...`,
    `根据您的专业背景和教学实践，我认为这个问题可以从教学改革和学生发展两个维度来分析...`,
    `作为经验丰富的教育工作者，您的思考很有深度。让我结合当前的教学数据和趋势为您分析...`,
    `这个问题涉及到现代高等教育的核心议题。基于您在${department}的教学实践经验...`
  ]
  
  const baseResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return `${baseResponse}

💡 **智能建议：**
基于您的教学数据分析，我建议您可以从以下几个方面思考：

**教学效果评估：**
- 分析当前课程的学生满意度和学习效果
- 收集学生反馈，了解教学改进需求
- 对比同行教学方法和效果

**学生发展指导：**
- 关注学生个体差异，提供个性化指导
- 建立学生学业发展档案
- 加强职业规划和就业指导

**专业发展提升：**
- 持续学习新的教学理念和方法
- 参与教学改革研究项目
- 建立跨学科合作关系

如果您需要更具体的建议或数据分析，请告诉我您想深入了解的具体方面！`
}