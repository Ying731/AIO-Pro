import { NextRequest, NextResponse } from 'next/server'

// n8n Webhook URL
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-ohuqvtxy.ap-southeast-1.clawcloudrun.com/webhook/student-ai-chat'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId } = await request.json()

    // 验证必要参数
    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 准备发送给n8n工作流的数据
    const workflowPayload = {
      message: message.trim(),
      userId,
      conversationId: conversationId || `conv-${Date.now()}-${userId}`,
      timestamp: new Date().toISOString()
    }

    // 调用n8n工作流
    const n8nResponse = await callN8nWorkflow(workflowPayload)

    if (n8nResponse.success) {
      return NextResponse.json({
        success: true,
        response: n8nResponse.response,
        messageType: n8nResponse.messageType,
        conversationId: n8nResponse.conversationId,
        tokensUsed: n8nResponse.tokensUsed
      })
    } else {
      // n8n工作流调用失败，使用备用AI逻辑
      console.warn('n8n workflow failed, using fallback response')
      const fallbackResponse = await generateFallbackResponse(message, userId)
      
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        messageType: 'fallback',
        conversationId: workflowPayload.conversationId
      })
    }

  } catch (error) {
    console.error('Student AI API error:', error)
    
    // 如果完全失败，返回友好的错误消息
    return NextResponse.json({
      success: true, // 仍然返回success=true以避免前端错误
      response: '抱歉，我暂时无法处理您的问题。请稍后再试，或者联系技术支持。',
      messageType: 'error'
    })
  }
}

/**
 * 调用n8n工作流 - 增强版本
 */
async function callN8nWorkflow(payload: any) {
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`n8n workflow attempt ${attempt}/${maxRetries}:`, {
        url: N8N_WEBHOOK_URL,
        payload: JSON.stringify(payload).substring(0, 100) + '...'
      })

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000) // 15秒超时

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeout)

      console.log(`n8n response status: ${response.status}, ok: ${response.ok}`)

      if (!response.ok) {
        throw new Error(`n8n webhook responded with status: ${response.status}`)
      }

      // 检查响应是否有内容
      const responseText = await response.text()
      console.log(`n8n response length: ${responseText.length}`)
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('n8n returned empty response')
      }

      const data = JSON.parse(responseText)
      console.log('n8n workflow success:', {
        success: data.success,
        hasResponse: !!data.response,
        messageType: data.messageType
      })

      return data

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`n8n workflow attempt ${attempt} failed:`, lastError.message)
      
      // 如果不是最后一次尝试，等待1秒后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  console.error('n8n workflow failed after all retries:', lastError?.message)
  return {
    success: false,
    error: lastError?.message || 'Unknown error'
  }
}

/**
 * 备用AI响应生成器
 * 当n8n工作流不可用时使用 - 现在包含更智能的响应
 */
async function generateFallbackResponse(message: string, userId: string): Promise<string> {
  const lowerMessage = message.toLowerCase()
  
  // 检测编程和算法问题
  if (lowerMessage.includes('递归') || lowerMessage.includes('recursion')) {
    return `递归算法是一种自己调用自己的算法思想。

📚 **递归的核心概念：**
- **递归函数**：在函数体内调用自身的函数
- **基本情况**：递归终止的条件
- **递归情况**：函数调用自身的情况

💻 **JavaScript递归示例 - 阶乘计算：**
\`\`\`javascript
function factorial(n) {
    // 基本情况：递归终止条件
    if (n <= 1) {
        return 1;
    }
    // 递归情况：调用自身
    return n * factorial(n - 1);
}

console.log(factorial(5)); // 输出: 120
\`\`\`

🔄 **执行过程：**
- factorial(5) = 5 × factorial(4)
- factorial(4) = 4 × factorial(3)  
- factorial(3) = 3 × factorial(2)
- factorial(2) = 2 × factorial(1)
- factorial(1) = 1 (基本情况)

⚠️ **注意事项：**
- 必须有明确的终止条件
- 避免无限递归导致栈溢出
- 递归深度不宜过大

需要更多递归算法示例吗？`
  }

  if (lowerMessage.includes('数据结构') || lowerMessage.includes('data structure')) {
    return `数据结构是计算机科学的核心基础！

📊 **常用数据结构：**

**1. 线性结构**
- 数组 (Array): 连续内存，随机访问O(1)
- 链表 (Linked List): 动态分配，插入删除灵活
- 栈 (Stack): 后进先出 (LIFO)，用于函数调用、表达式求值
- 队列 (Queue): 先进先出 (FIFO)，用于BFS、任务调度

**2. 非线性结构**  
- 树 (Tree): 分层结构，二叉树、AVL树、B树
- 图 (Graph): 顶点和边，用于网络、路径问题
- 哈希表 (Hash Table): 快速查找，平均O(1)复杂度

💡 **学习建议：**
1. 先理解概念和应用场景
2. 掌握基本操作的时间复杂度
3. 动手实现各种数据结构
4. 练习相关算法题

你想深入了解哪种数据结构呢？`
  }

  if (lowerMessage.includes('算法复杂度') || lowerMessage.includes('时间复杂度') || lowerMessage.includes('空间复杂度')) {
    return `算法复杂度分析是算法学习的重要基础！

⏰ **时间复杂度 (Big O)：**
- **O(1)**: 常数时间 - 数组随机访问
- **O(log n)**: 对数时间 - 二分查找
- **O(n)**: 线性时间 - 遍历数组
- **O(n log n)**: - 归并排序、快速排序
- **O(n²)**: 平方时间 - 冒泡排序、选择排序
- **O(2ⁿ)**: 指数时间 - 斐波那契递归

💾 **空间复杂度：**
- 算法执行过程中所需的额外存储空间
- 不包括输入数据本身占用的空间
- 考虑递归调用栈、辅助数组等

📈 **分析方法：**
1. 找出基本操作（比较、赋值等）
2. 计算基本操作执行次数
3. 用Big O表示增长趋势
4. 考虑最坏情况

🎯 **优化策略：**
- 选择合适的数据结构
- 减少不必要的嵌套循环
- 使用更高效的算法
- 空间换时间或时间换空间

需要分析具体算法的复杂度吗？`
  }

  if (lowerMessage.includes('javascript') || lowerMessage.includes('js') || lowerMessage.includes('前端')) {
    return `JavaScript编程学习指导！

🚀 **JavaScript核心概念：**

**1. 变量和作用域**
- var、let、const的区别
- 函数作用域 vs 块级作用域
- 变量提升 (Hoisting)

**2. 函数和闭包**
\`\`\`javascript
// 闭包示例
function createCounter() {
    let count = 0;
    return function() {
        return ++count;
    };
}
const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

**3. 异步编程**
- Promise和async/await
- 事件循环机制
- 回调地狱的解决方案

**4. ES6+新特性**
- 箭头函数、模板字符串
- 解构赋值、展开运算符
- 类和模块系统

💻 **学习路径建议：**
1. 掌握基础语法和概念
2. 理解DOM操作和事件处理
3. 学习现代框架 (React/Vue)
4. 了解Node.js后端开发

你在JavaScript的哪个部分遇到困难？`
  }

  if (lowerMessage.includes('机器学习') || lowerMessage.includes('machine learning') || lowerMessage.includes('ai')) {
    return `机器学习入门指导！

🤖 **机器学习三大类型：**

**1. 监督学习 (Supervised Learning)**
- 有标签数据训练
- 分类问题：垃圾邮件检测、图像识别
- 回归问题：房价预测、股票预测
- 算法：线性回归、决策树、SVM、神经网络

**2. 无监督学习 (Unsupervised Learning)**  
- 无标签数据，发现隐藏模式
- 聚类：客户分群、商品推荐
- 降维：数据可视化、特征提取
- 算法：K-means、PCA、自编码器

**3. 强化学习 (Reinforcement Learning)**
- 通过试错学习最优策略
- 游戏AI、自动驾驶、机器人控制
- 算法：Q-learning、深度Q网络

📊 **学习路径：**
1. **数学基础**: 线性代数、概率统计、微积分
2. **编程技能**: Python、NumPy、Pandas
3. **经典算法**: 从线性回归开始
4. **实践项目**: Kaggle竞赛、开源数据集

🛠️ **推荐工具：**
- Python: scikit-learn, TensorFlow, PyTorch
- 在线平台: Jupyter Notebook, Google Colab

想了解哪个具体方向呢？`
  }

  if (lowerMessage.includes('数据库') || lowerMessage.includes('database') || lowerMessage.includes('sql')) {
    return `数据库设计与SQL学习指导！

🗄️ **数据库基础概念：**

**1. 关系数据库理论**
- 实体-关系模型 (ER图)
- 主键、外键、索引
- 数据库范式 (1NF, 2NF, 3NF)

**2. SQL核心语法**
\`\`\`sql
-- 查询示例
SELECT s.name, c.course_name, e.grade
FROM students s
JOIN enrollments e ON s.id = e.student_id  
JOIN courses c ON e.course_id = c.id
WHERE e.grade >= 80
ORDER BY e.grade DESC;
\`\`\`

**3. 高级特性**
- 视图 (Views)
- 存储过程和函数
- 触发器 (Triggers)
- 事务处理 (ACID)

📊 **性能优化：**
- 合理设计索引
- 查询语句优化
- 数据库分区
- 读写分离

💡 **学习建议：**
1. 先掌握基本的增删改查
2. 理解表关联和子查询
3. 学习数据库设计原则
4. 练习复杂查询和优化

你在数据库的哪个方面需要帮助？`
  }

  // 问候语回复
  if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return `你好！我是启明星AI学习助手 🌟

我可以帮助您解决以下学习问题：

📚 **课程相关**
- 数据结构与算法
- 编程语言 (JavaScript, Python, Java等)
- 数据库原理与设计
- 机器学习基础
- 软件工程方法

💡 **学习支持**  
- 概念解释和代码示例
- 算法复杂度分析
- 学习方法建议
- 问题调试帮助

🎯 **使用建议**
请尽量描述具体问题，比如：
"请解释递归算法的工作原理"
"JavaScript闭包是什么？"
"如何优化数据库查询性能？"

请告诉我您需要什么帮助吧！`
  }

  // 默认智能回复
  return `感谢您使用启明星AI学习助手！🌟

我注意到您的问题，虽然我目前还在学习更好地理解各种提问方式，但我可以帮助您解决：

🔥 **热门学习主题：**
- **递归算法** - 概念解释和代码示例
- **数据结构** - 数组、链表、栈、队列、树等
- **JavaScript编程** - 基础语法到高级特性
- **机器学习** - 算法原理和实践应用  
- **数据库设计** - SQL查询和优化技巧
- **算法复杂度** - 时间和空间复杂度分析

💡 **提问小贴士：**
- 使用关键词：如"递归"、"数据结构"、"JavaScript"
- 描述具体场景：如"我在学习二叉树遍历时遇到困难"
- 提供代码片段：如果有相关代码或错误信息

请重新描述您的问题，我会为您提供更精准的帮助！`
}