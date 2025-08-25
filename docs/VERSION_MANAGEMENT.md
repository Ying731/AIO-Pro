# 版本管理系统

## 功能描述

本系统为启明星学习平台提供了完整的版本管理和更新记录功能，包括：

- 首页右下角版本号显示
- 点击版本号查看详细更新历史
- 项目开发进度跟踪
- 可控制的版本显示开关

## 文件结构

```
lib/
├── version.ts              # 版本配置和更新历史数据
components/
├── VersionDisplay.tsx      # 版本号显示组件
└── UpdateHistoryModal.tsx  # 更新历史弹窗组件
```

## 使用方法

### 1. 版本显示控制

通过环境变量控制版本号是否显示：

```env
# 开发环境 - 显示版本号
NEXT_PUBLIC_SHOW_VERSION=true

# 生产环境 - 隐藏版本号（上线后使用）
NEXT_PUBLIC_SHOW_VERSION=false
```

### 2. 更新版本信息

在 `lib/version.ts` 中更新版本配置：

```typescript
export const VERSION_CONFIG = {
  current: "v0.2.0",     // 当前版本号
  name: "启明星学习平台",   // 项目名称
  buildDate: "2025-01-26" // 构建日期
}
```

### 3. 添加更新记录

在 `UPDATE_HISTORY` 数组中添加新的更新记录：

```typescript
{
  version: "v0.2.0",
  date: "2025-01-26",
  type: "feature", // feature | bugfix | improvement | breaking
  title: "新功能标题",
  description: [
    "功能描述1",
    "功能描述2"
  ],
  todos: [
    "✅ 已完成的任务",
    "🔄 进行中的任务",
    "⏳ 待完成的任务"
  ]
}
```

### 4. 更新记录类型

- `feature`: 新功能 (蓝色标签)
- `bugfix`: 缺陷修复 (红色标签)  
- `improvement`: 优化改进 (绿色标签)
- `breaking`: 重大变更 (橙色标签)

### 5. TODO状态图标

- `✅`: 已完成 (绿色对勾)
- `🔄`: 进行中 (蓝色转圈)
- `⏳`: 待完成 (灰色圆圈)

## 组件特性

### VersionDisplay 组件
- 固定在页面右下角显示
- 只在开发模式或设置 `NEXT_PUBLIC_SHOW_VERSION=true` 时显示
- 点击可打开更新历史弹窗

### UpdateHistoryModal 组件  
- 响应式设计，支持桌面和移动端
- 按版本时间线展示更新记录
- 支持功能描述和开发进度双栏布局
- 可视化TODO状态和类型标签

## 部署注意事项

### Vercel 环境变量配置

生产环境部署时，在 Vercel 项目设置中添加：

```
NEXT_PUBLIC_SHOW_VERSION = false
```

这样可以在正式上线后隐藏版本显示按钮。

### 开发阶段

保持 `NEXT_PUBLIC_SHOW_VERSION=true` 以便查看版本信息和更新记录。

## 维护建议

1. **版本号规范**: 遵循语义化版本控制 (semver)
   - 主版本号：不兼容变更
   - 次版本号：新功能添加
   - 修订号：缺陷修复

2. **更新记录维护**: 每次重要更新都应该添加对应的更新记录

3. **TODO跟踪**: 保持TODO列表的实时更新，反映真实的开发进度

4. **发布前检查**: 上线前确保环境变量正确设置