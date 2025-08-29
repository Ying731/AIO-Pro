# N8N每日任务生成工作流集成方案

## 📋 方案概述

基于N8N工作流实现"基于OKR生成每日任务"，利用Gemini AI的强大能力，为学生生成个性化的每日学习任务。

## 🏗️ 架构设计

```
Next.js前端 → API Route → N8N工作流 → Gemini AI → Supabase数据库
```

### 数据流：
1. 用户点击"生成今日任务"
2. 前端调用 `/api/daily-tasks-n8n`
3. API调用N8N工作流Webhook
4. N8N获取学生OKR数据
5. N8N构建AI提示词
6. 调用Gemini AI生成任务
7. 解析并格式化任务数据
8. 返回结构化任务列表

## 🔧 N8N工作流配置

### 1. 导入工作流
将 `n8n-workflows/daily-task-generator.json` 导入到N8N中。

### 2. 配置凭据

**Supabase API凭据：**
- 名称: `Supabase API`
- URL: `https://figvgdumgvplzfzihvyt.supabase.co`
- Key: Supabase Service Role Key

**Gemini API凭据：**
- 名称: `Gemini API Key`
- 类型: `HTTP Header Auth`
- 头名称: `x-goog-api-key`
- 值: 您的Gemini API密钥

### 3. 激活工作流
1. 点击右上角"Activate"按钮
2. 复制Webhook URL
3. 更新环境变量中的N8N_WEBHOOK_URL

## 🌟 核心特性

### 1. 智能任务生成
- **AI驱动**: 使用Gemini 1.5 Flash模型
- **OKR关联**: 基于学生实际OKR目标
- **个性化**: 考虑学习进度和时间安排

### 2. 容错机制
- **多级回退**: N8N失败 → 本地算法 → 错误处理
- **超时处理**: 30秒超时保护
- **错误记录**: 详细的错误日志

### 3. 任务优化
- **时长控制**: 30分钟-3小时合理范围
- **优先级排序**: 基于目标紧急程度
- **类别标签**: 理论学习、编程练习、项目实践等

## 🚀 部署步骤

### 1. 环境变量配置
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
GEMINI_API_KEY=your-gemini-api-key
```

### 2. N8N工作流部署
1. 登录N8N界面
2. 导入 `daily-task-generator.json`
3. 配置API凭据
4. 激活工作流
5. 测试Webhook

### 3. API端点测试
```bash
curl -X POST http://localhost:3001/api/daily-tasks-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid",
    "preferences": {
      "taskCount": 5,
      "maxDuration": 480
    }
  }'
```

## 📊 监控和维护

### 1. 执行监控
- N8N执行历史查看
- API响应时间监控
- 错误率统计

### 2. 成本控制
- Gemini API免费额度：每天1500次请求
- 建议实现本地缓存减少API调用
- 监控token使用量

### 3. 性能优化
- 提示词优化提升生成质量
- 并发控制避免API限制
- 结果缓存机制

## 🔍 测试验证

### 1. 功能测试
- OKR数据获取正确性
- AI任务生成质量
- 数据格式解析准确性

### 2. 错误处理测试
- N8N服务不可用
- Gemini API限额超出
- 网络超时情况

### 3. 性能测试
- 并发请求处理
- 响应时间优化
- 资源使用监控

## 💡 扩展建议

1. **任务模板库**: 预定义常用任务模板
2. **学习偏好**: 记录用户喜好优化生成
3. **进度反馈**: 基于完成情况调整难度
4. **多模态支持**: 集成图片、文档理解
5. **协作任务**: 支持团队学习任务生成

---

通过这个N8N工作流集成方案，用户可以获得基于真实AI的个性化每日任务推荐，大幅提升学习效率和目标达成率。