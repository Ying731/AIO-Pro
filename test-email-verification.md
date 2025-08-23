# 邮件验证测试指南

## 问题分析
邮件验证失败的主要原因：
1. **APP_URL 环境变量配置错误** - 在 Vercel 部署时指向错误的域名
2. **验证回调处理不完整** - 没有正确处理不同类型的验证 token
3. **Supabase 重定向 URL 配置** - 需要在 Supabase 控制台添加正确的回调 URL

## 修复内容

### 1. 修复了注册 API (`/api/register/route.ts`)
- 自动检测 Vercel 部署环境，使用正确的回调 URL
- 添加了详细的日志输出用于调试

### 2. 修复了验证回调页面 (`/auth/callback/page.tsx`)
- 改进了 token 验证逻辑，支持多种验证类型
- 添加了更好的错误处理和调试信息

### 3. 环境变量配置
- 本地开发：使用 `APP_URL=http://localhost:3000`
- Vercel 部署：自动使用 `VERCEL_URL` 环境变量

## 测试步骤

### 本地测试
1. 访问 http://localhost:3000/test-verification
2. 点击"检查环境变量"确认配置
3. 输入测试邮箱进行注册测试
4. 检查邮箱中的验证链接
5. 点击验证链接，确认跳转到正确的回调页面

### 部署前检查
1. 确保 Vercel 环境变量已正确设置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. 在 Supabase 控制台添加重定向 URL：
   - 开发环境：`http://localhost:3000/auth/callback`
   - 生产环境：`https://your-domain.vercel.app/auth/callback`

## 部署到 Vercel

### 环境变量设置
在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://figvgdumgvplzfzihvyt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ3ZnZHVtZ3ZwbHpmemlodnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTE1NzQsImV4cCI6MjA3MTQ4NzU3NH0.tJL2yn5H87NXa6DZUqbIZuvT4H6wPkJE-dBz50kbfAA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZ3ZnZHVtZ3ZwbHpmemlodnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxMTU3NCwiZXhwIjoyMDcxNDg3NTc0fQ.bGofRgmU6lWblTrb7IcwywlUHl5QPMK_bdWSjqilyjY
NODE_ENV=production
```

### Supabase 配置
在 Supabase 控制台 > Authentication > URL Configuration 中添加：
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/auth/callback`

## 验证成功后的流程
1. 用户点击邮件中的验证链接
2. 跳转到 `/auth/callback` 页面
3. 自动验证 token 并创建用户档案
4. 显示成功消息并跳转到登录页面

## 故障排除
如果验证仍然失败，检查：
1. 浏览器控制台的错误信息
2. Vercel 函数日志
3. Supabase 认证日志
4. 确认邮件中的链接格式是否正确