// 版本管理配置
export const VERSION_CONFIG = {
  current: "v0.3.0",
  name: "启明星学习平台",
  buildDate: "2025-08-28"
}

// 更新记录数据类型
export interface UpdateRecord {
  version: string
  date: string
  type: 'feature' | 'bugfix' | 'improvement' | 'breaking'
  title: string
  description: string[]
  todos: string[]
}

// 项目开发历史记录
export const UPDATE_HISTORY: UpdateRecord[] = [
  {
    version: "v0.3.0",
    date: "2025-08-28",
    type: "feature",
    title: "项目管理系统完整实现",
    description: [
      "设计并创建项目管理数据库表结构",
      "将课程管理页面重构为项目管理系统",
      "实现学生项目参与、进度追踪和状态管理",
      "完善目标管理系统的编辑和删除功能",
      "优化用户界面显示项目类型、难度和进度信息"
    ],
    todos: [
      "✅ 设计projects和project_enrollments数据表",
      "✅ 在Supabase中创建项目管理相关表",
      "✅ 重构/courses页面为项目管理界面", 
      "✅ 实现项目参与和状态追踪功能",
      "✅ 修复目标管理编辑功能bug",
      "✅ 添加目标编辑弹窗和API支持",
      "✅ 实现目标删除的数据库同步",
      "✅ 优化目标统计面板显示",
      "✅ 完善项目管理界面的用户体验"
    ]
  },
  {
    version: "v0.2.0",
    date: "2025-08-27",
    type: "feature",
    title: "学生AI助手智能记忆系统",
    description: [
      "集成n8n工作流与Google Gemini API构建智能对话系统",
      "实现RAG知识检索和关键词智能分类路由",
      "完成用户记忆上下文和对话历史管理",
      "添加个性化学习建议和多轮对话理解",
      "构建容错机制和备用回复系统"
    ],
    todos: [
      "✅ n8n工作流设计和Gemini API集成",
      "✅ 消息分类和关键词提取功能",
      "✅ RAG知识检索系统实现",
      "✅ 用户记忆和学习偏好存储",
      "✅ 对话历史和上下文管理",
      "✅ 增强提示词构建和个性化回复",
      "✅ 错误处理和重试机制优化",
      "✅ 前端API连接和超时管理",
      "✅ 数据库UUID类型和查询优化",
      "✅ 记忆功能端到端测试验证"
    ]
  },
  {
    version: "v0.1.0",
    date: "2025-01-25",
    type: "feature",
    title: "项目初始化和基础架构",
    description: [
      "基于L.I.G.H.T.架构搭建Next.js项目框架",
      "集成Supabase数据库和身份验证",
      "完成数据库表结构设计（22个核心表）",
      "实现基础登录注册界面",
      "配置Vercel部署环境"
    ],
    todos: [
      "✅ 项目初始化和技术栈选择",
      "✅ Supabase数据库配置",
      "✅ 用户认证系统基础搭建",
      "✅ 基础UI组件和样式设计",
      "✅ 登录注册页面实现",
      "✅ 数据库表结构设计",
      "✅ 邮箱验证功能",
      "✅ 目标管理组件（GoalManager）",
      "✅ TypeScript错误修复",
      "✅ 版本管理和更新记录系统"
    ]
  }
]

// 获取当前版本信息
export const getCurrentVersion = () => VERSION_CONFIG

// 获取更新历史
export const getUpdateHistory = () => UPDATE_HISTORY

// 检查是否为开发模式（后期可以通过环境变量控制）
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_VERSION === 'true'
}