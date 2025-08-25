// 版本管理配置
export const VERSION_CONFIG = {
  current: "v0.1.0",
  name: "启明星学习平台",
  buildDate: "2025-01-25"
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
      "🔄 版本管理和更新记录系统（进行中）"
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