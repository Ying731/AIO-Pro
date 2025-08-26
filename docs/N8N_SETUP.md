# n8n学生AI聊天工作流配置指南 - Gemini版

## 📋 工作流概述

这是一个完整的学生AI聊天助手工作流，集成Google Gemini AI，包含以下功能：
- 消息分类和智能路由
- RAG知识库检索
- 学生信息查询
- 对话历史管理
- Google Gemini API调用
- 对话记录存储

## 🚀 n8n部署和配置

### 1. n8n安装

**选项A：Docker部署（推荐）**
```bash
# 创建数据目录
mkdir -p ~/.n8n

# 运行n8n容器
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**选项B：npm安装**
```bash
npm install -g n8n
n8n start
```

### 2. 访问n8n界面

打开浏览器访问：`http://localhost:5678`

### 3. 导入工作流

1. 在n8n界面中点击"Import from File"
2. 选择 `n8n-workflows/student-ai-chat.json` 文件
3. 工作流将自动导入

## 🔧 凭据配置

工作流需要配置以下API凭据：

### 1. Supabase API凭据
- **凭据名称**: `Supabase API`
- **Host**: `https://figvgdumgvplzfzihvyt.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ3ZnZHVtZ3ZwbHpmemlodnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxMTU3NCwiZXhwIjoyMDcxNDg3NTc0fQ.bGofRgmU6lWblTrb7IcwywlUHl5QPMK_bdWSjqilyjY`

### 2. Google Gemini API凭据
- **凭据名称**: `Google Gemini API`
- **凭据类型**: 选择 `Generic Credential Type`
- **配置字段**:
  - `apiKey`: 您的Google Gemini API密钥
  
**获取Gemini API密钥步骤**:
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的Google账户
3. 点击"Create API Key"创建新的API密钥
4. 复制生成的API密钥

## 📡 Webhook配置

### 1. 激活工作流
1. 在工作流编辑器中点击右上角的"Activate"按钮
2. 工作流状态变为"Active"

### 2. 获取Webhook URL
1. 点击"Webhook"节点
2. 复制生成的Production URL
3. URL格式类似：`https://your-n8n-domain.com/webhook/student-ai-chat`

### 3. 测试Webhook
使用curl测试工作流：
```bash
curl -X POST https://your-n8n-instance.com/webhook/student-ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "什么是数据结构？",
    "userId": "test-user-123",
    "conversationId": "conv-456"
  }'
```

## 🗄️ 数据库表结构要求

工作流依赖以下Supabase表：

### 1. knowledge_documents
```sql
CREATE TABLE knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. chat_history
```sql
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  conversation_id TEXT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type TEXT, -- 'knowledge_qa', 'learning_query', etc.
  tokens_used INTEGER,
  model_used TEXT, -- 'gemini-1.5-flash-latest'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. students（已存在）
确保包含以下字段：
- user_id
- student_id  
- grade
- major

## 🔄 工作流节点详解

### 1. 消息分类节点
- **功能**：分析用户消息类型
- **输出**：messageType ('knowledge_qa', 'learning_query', 'learning_advice', 'general_chat')

### 2. 路由选择节点
- **功能**：根据消息类型选择处理路径
- **路由**：知识问答走RAG检索，其他走直接查询

### 3. RAG知识检索节点
- **功能**：从knowledge_documents表搜索相关内容
- **限制**：返回最多3条相关记录

### 4. 获取学生信息节点
- **功能**：查询当前用户的学生信息
- **用途**：为AI提供个性化上下文

### 5. 获取对话历史节点
- **功能**：获取最近10条对话记录
- **用途**：维持对话连续性

### 6. Gemini API调用节点
- **模型**：gemini-1.5-flash-latest
- **参数**：
  - temperature: 0.7
  - maxOutputTokens: 800
  - topP: 0.8
  - topK: 40

## 🛠️ 自定义配置

### 修改AI模型版本
在"Gemini API调用"节点中，可以修改URL中的模型：
- **gemini-1.5-flash-latest**: 最新快速版本（推荐）
- **gemini-1.5-pro-latest**: 更强能力版本
- **gemini-1.0-pro**: 稳定版本

### 调整生成参数
在"Gemini API调用"节点的generationConfig中修改：
- **temperature**: 0.0-1.0 (创造性程度，0.7推荐)
- **maxOutputTokens**: 最大输出长度 (800推荐)
- **topP**: 0.0-1.0 (多样性控制，0.8推荐)
- **topK**: 1-40 (候选词数量，40推荐)

### 调整知识检索
在"RAG知识检索"节点中，可以修改：
- **limit**: 返回结果数量
- **where条件**: 搜索条件和算法

### 自定义系统提示词
在"准备Gemini请求"节点的Function代码中修改`systemPrompt`变量。

## 📊 监控和日志

### 1. 执行历史
- n8n界面 → Executions 查看所有执行记录
- 可以查看每次调用的输入输出和执行时间

### 2. 错误处理
- 工作流包含基本错误处理
- 失败的执行会在Executions中标记为红色

### 3. 性能监控
- 关注Gemini API调用的token使用量
- 监控Supabase查询响应时间

## 🔐 安全注意事项

1. **API密钥安全**：确保Gemini API密钥安全存储
2. **Webhook安全**：生产环境建议添加身份验证
3. **数据隔离**：确保学生只能访问自己的数据
4. **速率限制**：注意Gemini API的调用频率限制

## 💰 成本控制

### Gemini API定价（2025年）
- **gemini-1.5-flash**: 免费层每分钟15次请求，每日1500次
- **gemini-1.5-pro**: 免费层每分钟2次请求，每日50次

### 优化建议
1. 优先使用gemini-1.5-flash（更快更便宜）
2. 合理设置maxOutputTokens避免浪费
3. 实现本地缓存减少API调用
4. 监控token使用量

## 📈 扩展建议

1. **添加缓存**：常见问题可以缓存回答
2. **多语言支持**：根据需要支持英文回答
3. **情感分析**：识别学生情绪状态
4. **学习分析**：记录学习行为数据
5. **图片理解**：利用Gemini的多模态能力

---

配置完成后，您就可以通过API调用这个基于Gemini的工作流来实现学生AI聊天功能了！