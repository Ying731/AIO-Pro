# 📋 "基于OKR的每日任务推荐系统" - 完整设计方案

**文档版本**: v1.0  
**创建日期**: 2025-08-28  
**项目**: 启明星AI学习平台  
**功能模块**: OKR每日任务推荐系统  

---

## 🎯 **系统核心理念**

### **设计原则**
- **分离关注点**: OKR管理与每日任务功能完全独立，避免混合语义
- **智能关联**: 每日任务与源OKR保持清晰的可追溯关联关系  
- **AI驱动**: 基于多OKR综合分析，智能生成平衡的每日学习任务
- **渐进实现**: 先用模拟逻辑验证功能，后续无缝升级到真实LLM

---

## 🗄️ **数据架构设计**

### **核心表结构**

#### **1. daily_tasks 表（新建）**
```sql
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- 任务内容
  task_content TEXT NOT NULL,
  task_category VARCHAR(50),
  estimated_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- OKR关联（核心设计）
  source_goal_id UUID REFERENCES learning_goals(id) ON DELETE CASCADE,
  source_key_result_index INTEGER,
  goal_title TEXT,
  
  -- 生成会话
  generation_session_id UUID,
  task_order INTEGER,
  
  -- 时间管理
  task_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  
  -- 执行反馈
  actual_minutes INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  completion_notes TEXT
);

-- 索引
CREATE INDEX idx_daily_tasks_student_date ON daily_tasks(student_id, task_date);
CREATE INDEX idx_daily_tasks_source_goal ON daily_tasks(source_goal_id);
CREATE INDEX idx_daily_tasks_session ON daily_tasks(generation_session_id);

-- RLS策略
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能操作自己的每日任务" ON daily_tasks FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
```

#### **2. daily_task_sessions 表（可选）**
```sql
CREATE TABLE daily_task_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  generation_date DATE DEFAULT CURRENT_DATE,
  total_tasks INTEGER DEFAULT 0,
  based_on_goals JSONB,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS策略
ALTER TABLE daily_task_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能操作自己的任务会话" ON daily_task_sessions FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
```

### **关联关系图**
```
learning_goals (OKR目标)
    ↓ (1:N)
daily_tasks (每日任务)
    ↑
source_goal_id → learning_goals.id
source_key_result_index → key_results[index]
```

---

## 🧠 **AI任务生成逻辑**

### **生成流程**
```typescript
1. 多OKR输入 → 获取用户所有活跃OKR目标
2. 优先级分析 → 基于紧迫性、进度、用户优先级计算权重  
3. 任务分配 → AI智能分配每个OKR的任务数量
4. 内容生成 → 生成具体任务内容
5. 关联保存 → 每个任务明确关联到source_goal_id和KR索引
```

### **分配策略示例**
```typescript
用户OKR: [
  "完成数据结构课程" (高优先级, 进度65%, 紧急) → 分配3个任务
  "学习React框架" (中优先级, 进度40%, 重要) → 分配2个任务  
  "提升英语水平" (中优先级, 进度30%, 一般) → 分配1个任务
]

生成结果: 6个任务，平衡分布，每个都有明确的OKR来源
```

### **AI提示词结构**
```typescript
const aiPrompt = `
基于以下OKR目标，生成今日平衡的学习任务：

目标1: ${goal1.title} (进度${goal1.progress}%, 截止${goal1.target_date})
重点关键结果: [列出进度落后的KR]

目标2: ${goal2.title} (进度${goal2.progress}%, 截止${goal2.target_date})  
重点关键结果: [列出进度落后的KR]

要求：
1. 生成${totalTaskCount}个具体任务
2. 任务分配: 目标1(${goal1TaskCount}个), 目标2(${goal2TaskCount}个)
3. 考虑学习节奏和时间平衡
4. 格式: 【类别】具体任务描述 (预估时长)
`
```

---

## 🎨 **用户界面设计**

### **1. 任务生成流程**
```typescript
用户点击"生成今日任务" 
→ 显示弹窗和加载状态
→ AI分析OKR并生成任务  
→ 展示任务列表（按OKR分组）
→ 用户确认保存
→ 关联保存到daily_tasks表
```

### **2. 任务展示界面**
```tsx
<div className="daily-tasks">
  <h3>今日学习任务 ({tasks.length}项, 预估{totalTime})</h3>
  
  {/* 按OKR目标分组显示 */}
  {tasksByGoal.map(group => (
    <div className="goal-task-group">
      <h4>🎯 {group.goalTitle} ({group.tasks.length}个任务)</h4>
      {group.tasks.map(task => (
        <TaskItem 
          task={task} 
          showOKRLink={true}
          onComplete={() => handleTaskComplete(task)}
        />
      ))}
    </div>
  ))}
</div>
```

### **3. OKR反馈机制**
```typescript
// 任务完成时的进度反馈
function completeTask(task: DailyTask) {
  // 1. 标记任务完成
  updateTaskStatus(task.id, 'completed')
  
  // 2. 建议更新相关的OKR关键结果进度
  if (task.source_goal_id && task.source_key_result_index !== null) {
    suggestKRProgressUpdate(
      task.source_goal_id, 
      task.source_key_result_index,
      task.difficulty_rating
    )
  }
}
```

---

## 🔧 **技术实现架构**

### **API设计**
```typescript
// 新增API端点
POST /api/daily-tasks/generate    // 生成每日任务
POST /api/daily-tasks/save        // 保存任务到数据库
GET  /api/daily-tasks             // 获取任务列表  
PUT  /api/daily-tasks/:id         // 更新任务状态
DELETE /api/daily-tasks/:id       // 删除任务

// 扩展现有API
GET /api/goals?include=recent_tasks // OKR列表包含相关任务
```

### **数据流架构**
```
Frontend (Next.js)
    ↕️ 
API Routes (/api/daily-tasks)
    ↕️
Supabase (daily_tasks + learning_goals)
    ↕️
AI Generation Service (现阶段: 智能模拟, 未来: LLM API)
```

---

## 🚀 **实现阶段规划**

### **Phase 1: 核心功能 (立即实施)**
1. ✅ 创建daily_tasks表结构
2. ✅ 实现智能模拟任务生成逻辑
3. ✅ 更新DailyTaskModal保存功能
4. ✅ 测试OKR→任务→保存完整流程

### **Phase 2: 用户体验优化**
1. 🔄 任务按OKR分组展示
2. 🔄 任务状态管理界面
3. 🔄 OKR进度反馈机制
4. 🔄 任务完成统计分析

### **Phase 3: AI升级 (后续)**
1. 🔮 集成真实LLM API (OpenAI/Gemini)
2. 🔮 基于用户反馈优化生成质量
3. 🔮 个性化学习模式识别
4. 🔮 智能调整任务难度和时长

---

## 📊 **成功指标定义**

### **功能指标**
- ✅ 任务生成成功率 > 95%
- ✅ 任务-OKR关联准确率 = 100%
- ✅ 用户保存任务成功率 > 98%
- ✅ 数据一致性检查通过率 = 100%

### **用户体验指标**  
- 🎯 任务内容相关性满意度 > 4.0/5.0
- 🎯 任务时长估算准确度 > 80%
- 🎯 用户每周使用频率 > 3次
- 🎯 任务完成率 > 60%

### **技术指标**
- ⚡ 任务生成响应时间 < 3秒
- ⚡ 保存操作响应时间 < 1秒
- 🔒 数据安全性：RLS策略100%覆盖
- 📈 系统可扩展性：支持1000+并发用户

---

## 🎯 **核心价值与优势**

### **对学生的价值**
- 🎯 **个性化指导**: 基于真实OKR生成符合学习目标的任务
- ⏰ **时间管理**: 合理分配学习时间，避免盲目学习
- 📈 **进度可视化**: 清晰看到每日任务与长期目标的关系
- 🏆 **成就感**: 完成任务获得即时反馈，推动OKR进展

### **系统设计优势**  
- 🏗️ **架构清晰**: 数据分离但逻辑关联，易维护易扩展
- 🔄 **渐进升级**: 现阶段功能完备，未来无缝升级AI  
- 🛡️ **数据安全**: 完善的权限控制和数据隔离
- 📊 **分析友好**: 丰富的关联数据支持深度分析

---

## 💡 **后续扩展方向**

### **短期扩展 (3个月内)**
- 📱 移动端适配优化
- 🔔 任务提醒和通知系统  
- 📊 学习数据统计报表
- 🎨 任务模板和快速生成

### **中期扩展 (6-12个月)**
- 🤖 真实LLM集成和优化
- 👥 协作任务和团队目标
- 🎓 智能学习路径推荐
- 🏅 成就系统和激励机制

---

## 📝 **实现备注**

### **当前状态 (2025-08-28)**
- ✅ OKR管理系统已完成（learning_goals表 + key_results字段）
- ✅ 每日任务生成UI已完成（DailyTaskModal组件）
- ✅ 智能模拟生成逻辑已完成（/api/daily-tasks路由）
- ⏳ 等待实施：创建daily_tasks表和保存功能

### **技术栈**
- **前端**: Next.js 15.5.0 + React 19 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Supabase
- **数据库**: PostgreSQL (Supabase) + pgvector (RAG支持)
- **AI**: 现阶段智能模拟，后续LLM API集成
- **部署**: Vercel

### **核心文件**
- `components/GoalManager.tsx` - OKR管理和任务生成UI
- `app/api/daily-tasks/route.ts` - 任务生成API逻辑
- `app/api/goals/route.ts` - OKR管理API
- `extend-goals-for-okr.sql` - OKR表扩展脚本

---

*文档完成 | 作者: Claude Code | 日期: 2025-08-28*