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

    // 获取用户档案信息
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // 获取学生信息（如果是学生）
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 获取对话历史
    const { data: messageHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 构建上下文
    const context = buildStudentContext(profile, student, messageHistory)
    
    // 搜索相关知识库内容
    const knowledgeResults = await searchKnowledgeBase(message, userId)
    
    // 生成AI响应
    const aiResponse = await generateStudentAIResponse(message, context, knowledgeResults)

    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Student AI API error:', error)
    return NextResponse.json(
      { error: '生成AI回复时出现错误' },
      { status: 500 }
    )
  }
}

function buildStudentContext(profile: any, student: any, messageHistory: any[]) {
  const context = {
    userName: profile?.full_name || '同学',
    major: student?.major || '未知专业',
    grade: student?.grade || 1,
    gpa: student?.gpa || 0,
    totalCredits: student?.total_credits || 0,
    enrollmentYear: student?.enrollment_year || new Date().getFullYear(),
    recentMessages: messageHistory?.slice(0, 5).reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    })) || []
  }
  
  return context
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

async function generateStudentAIResponse(message: string, context: any, knowledgeResults: any[] = []): Promise<string> {
  // 这里实现AI逻辑，可以集成OpenAI、Claude或其他AI服务
  // 目前使用智能模拟响应，结合知识库搜索结果
  
  const { userName, major, grade, gpa, totalCredits } = context
  const lowerMessage = message.toLowerCase()
  
  // 如果有知识库搜索结果，优先使用
  if (knowledgeResults.length > 0) {
    const topResult = knowledgeResults[0]
    const knowledgeContent = `

📚 **相关知识参考：**
**${topResult.title}**
${topResult.content}

*来源：启明星知识库 - ${topResult.category}*

---

基于以上知识和您的个人情况（${major}专业，${grade}年级，GPA: ${gpa.toFixed(2)}），我为您提供以下建议：`
    
    // 根据知识库内容生成更精准的回答
    if (topResult.category === '学习方法') {
      return knowledgeContent + `

💡 **个性化学习建议：**
- 结合您当前的学习进度调整学习计划
- 根据专业特点选择最适合的学习策略
- 定期评估学习效果并优化方法

🎯 **实施建议：**
- 从简单的技巧开始实践
- 保持持续性，形成良好学习习惯
- 根据效果及时调整方法

需要我为您制定具体的学习计划吗？`
    }
    
    if (topResult.category === '课程指导') {
      return knowledgeContent + `

🎓 **针对您的情况：**
- 当前已获得${totalCredits}学分，建议合理安排后续课程
- 根据您的GPA表现，推荐选择适当难度的课程组合
- 考虑专业发展方向，优先选择核心课程

📋 **选课策略：**
- 平衡必修课与选修课的比例
- 关注课程的先修要求和课程序列
- 考虑授课时间安排，避免冲突

想了解具体某门课程的详细信息吗？`
    }
    
    return knowledgeContent + `

希望这些信息对您有帮助！如果还有其他问题，请随时询问。`
  }
  
  // 原有的智能响应逻辑保持不变
  // 学习规划相关
  if (lowerMessage.includes('学习计划') || lowerMessage.includes('规划') || lowerMessage.includes('安排')) {
    return `${userName}，根据您${major}专业${grade}年级的情况，我为您推荐以下学习规划：

📚 **当前学期建议：**
- 优先完成核心课程，确保GPA稳步提升（当前GPA: ${gpa.toFixed(2)}）
- 结合专业方向，选择1-2门选修课扩展知识面
- 参与实践项目，积累实际经验

⏰ **时间安排：**
- 每日学习2-3小时专业课程
- 每周安排1-2次复习和总结
- 保持规律作息，提高学习效率

🎯 **学期目标：**
- 本学期目标学分：${Math.max(15, 20 - totalCredits/10)}学分
- GPA目标：${Math.min(4.0, gpa + 0.2).toFixed(1)}以上

需要我为您制定更详细的学习计划吗？`
  }
  
  // 课程咨询相关
  if (lowerMessage.includes('课程') || lowerMessage.includes('选课') || lowerMessage.includes('学分')) {
    return `关于课程选择，我来为您分析一下：

📖 **专业课程建议：**
- ${major}专业核心课程是基础，务必认真对待
- 根据您当前${totalCredits}学分的情况，建议本学期选修${Math.max(12, 18 - totalCredits/10)}学分

🔍 **选课策略：**
- 平衡理论与实践课程比例
- 考虑课程难度分布，避免过度集中
- 关注授课教师评价和教学风格

💡 **个性化推荐：**
基于您的GPA ${gpa.toFixed(2)}，建议选择与您能力匹配的课程组合，既要挑战自己，又要确保学习质量。

具体需要了解哪门课程的详细信息呢？`
  }
  
  // 成绩分析相关
  if (lowerMessage.includes('成绩') || lowerMessage.includes('gpa') || lowerMessage.includes('分析')) {
    const gradeLevel = gpa >= 3.5 ? '优秀' : gpa >= 3.0 ? '良好' : gpa >= 2.5 ? '中等' : '需要加强'
    return `让我为您分析一下学习成绩情况：

📊 **成绩概况：**
- 当前GPA：${gpa.toFixed(2)} (${gradeLevel}水平)
- 已获得学分：${totalCredits}
- 入学年份：${context.enrollmentYear}

📈 **提升建议：**
${gpa >= 3.5 ? 
  '您的成绩表现优异！建议继续保持，可以考虑申请奖学金或参与更有挑战性的项目。' : 
  gpa >= 3.0 ? 
  '成绩表现良好，建议在保持现有优势的基础上，重点攻克薄弱科目。' :
  '还有很大提升空间，建议制定详细的学习计划，必要时寻求学习帮助。'
}

🎯 **具体行动：**
- 分析各科成绩分布，找出薄弱环节
- 制定针对性的复习和预习计划
- 利用课余时间参与学习小组或寻求老师答疑

需要我帮您制定具体的成绩提升计划吗？`
  }
  
  // 职业规划相关
  if (lowerMessage.includes('就业') || lowerMessage.includes('职业') || lowerMessage.includes('实习') || lowerMessage.includes('工作')) {
    return `关于职业发展规划，让我为您提供一些建议：

🚀 **${major}专业就业前景：**
- 行业需求旺盛，就业机会丰富
- 薪资水平相对较高，发展空间广阔
- 技术更新快，需要持续学习

📋 **能力建设建议：**
- 扎实的专业基础知识
- 良好的实践动手能力
- 团队协作和沟通技能
- 持续学习的能力

🎯 **行动计划：**
- ${grade <= 2 ? '重点打好专业基础，参与课程项目' : 
     grade <= 3 ? '寻找实习机会，积累实际工作经验' : 
     '准备求职材料，提升面试技能'}
- 关注行业动态，了解最新技术趋势
- 建立专业人脉，参与相关社团活动

需要我为您推荐一些具体的实习机会或职业发展路径吗？`
  }
  
  // 心理支持和动机激励
  if (lowerMessage.includes('压力') || lowerMessage.includes('焦虑') || lowerMessage.includes('困难') || lowerMessage.includes('迷茫')) {
    return `我理解您现在的感受，学习过程中遇到困难是很正常的。

💪 **情绪调节建议：**
- 将大目标分解为小目标，逐步完成
- 定期总结自己的进步和成就
- 保持适度运动，有助于缓解压力

🤝 **寻求帮助：**
- 与同学、朋友分享你的困扰
- 主动向老师请教学习方法
- 学校心理咨询中心提供专业支持

🌟 **积极心态：**
作为${major}专业${grade}年级的学生，您已经在学习路上走过了一段路程。每个人都有自己的节奏，重要的是不断前进。

记住，困难是成长的机会，您并不孤单。我会一直在这里支持您！

想聊聊具体是什么让您感到困扰吗？`
  }
  
  // 默认智能响应
  const responses = [
    `${userName}，这是个很好的问题！基于您${major}专业的背景，我建议您可以从以下几个角度来思考...`,
    `作为${grade}年级的学生，您提出的这个问题很有深度。让我结合您的学习情况来分析...`,
    `我理解您的疑问。根据您当前的学习进度和专业特点，我认为...`,
    `这个问题涉及到${major}专业的核心内容。基于您的GPA ${gpa.toFixed(2)}的学习表现，我建议...`,
    `很高兴为您解答！结合您的学习目标和当前情况，让我为您提供一些个性化建议...`
  ]
  
  const baseResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return `${baseResponse}

如果您需要更具体的帮助，请告诉我您想了解的具体方面，比如：
• 学习方法和技巧
• 课程选择建议  
• 成绩提升策略
• 职业规划指导
• 时间管理建议

我会根据您的具体需求提供更详细的指导！`
}