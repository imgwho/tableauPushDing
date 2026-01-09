# Changelog

## 2026-01-09 - UI/UX 深度优化与交互重构

### 🎨 UI/UX 改进 (User Experience)
*   **告别原生弹窗**：移除了所有浏览器原生的 `alert()` 和 `confirm()`。
    *   **通知**：操作成功/失败现在通过右下角的 `Toast` 消息提示。
    *   **确认**：删除操作现在展示自定义的 `ConfirmModal`，风格统一且美观。
*   **回归 Modal 布局**：放弃全屏页面跳转，将新建、编辑、详情、用户管理等功能还原为 **Modal 弹出层**，保证用户不离开当前上下文，操作更连贯。
*   **环境视觉区分**：
    *   **正式环境**：橙红色标记，醒目提示。
    *   **测试/开发环境**：绿色标记，表示安全。
    *   **默认环境**：紫色标记。

### 💻 代码变更 (Code Impact)
*   `frontend/src/App.tsx`:
    *   移除了 `window.confirm`，集成 `ConfirmModal` 和 `ToastContainer`。
    *   状态管理回归 Modal 模式 (`showForm`, `selectedTask` 等)。
*   `frontend/src/components/ConfirmModal.tsx`: **[NEW]** 新增通用确认对话框组件。
*   `frontend/src/components/Toast.tsx`: **[NEW]** 新增消息通知组件。
*   `frontend/src/utils/styleHelper.ts`: **[NEW]** 新增环境颜色计算逻辑。
*   `frontend/src/components/{TaskForm, TaskDetail, UserManager}.tsx`: 
    *   样式回滚为 Modal (`fixed inset-0`)。
    *   修复了 TypeScript 未使用变量的 lint 错误。

---

## 2026-01-09 - 任务修改与状态控制

### ✨ 新功能 (Features)
*   **任务编辑**：支持修改现有任务的所有配置（名称、环境、时间、用户、工作簿）。
*   **启用/禁用**：新增任务状态开关。
    *   禁用后的任务在列表中会变灰并显示虚线边框。
    *   禁用任务无法被手动触发或自动调度。
*   **智能关联**：在编辑任务时，如果切换了“环境”，会自动清空已选的“用户”和“工作簿”，防止数据不一致。
*   **Cron 反向解析**：编辑任务时，自动将后台的 Cron 表达式（如 `0 9 * * 1-5`）解析回表单的 UI 控件状态。

### 💻 代码变更 (Code Impact)
*   `index.ts`:
    *   新增 `PUT /api/tasks/:id` 接口。
    *   更新后自动调用 `schedulerService.reloadAllTasks()` 重启调度任务。
*   `frontend/src/components/TaskForm.tsx`:
    *   重构为支持 `initialData` 传入，实现“编辑模式”。
    *   新增 `parseCron` 函数处理 Cron 到 UI 的映射。
*   `frontend/src/types.ts`: 新增 `UpdateTaskDTO` 类型，包含 `enabled` 字段。

---

## 2026-01-09 - 界面汉化与详情查看

### ✨ 新功能 (Features)
*   **详情查看**：点击任务卡片上的 👁️ 图标，可查看任务的详细配置。
    *   展示解析后的具体用户列表（头像+姓名）。
    *   展示完整的工作簿列表。
*   **人性化时间**：将复杂的 Cron 表达式（`0 9 * * *`）转换为中文描述（“每天 09:00”）。

### 🎨 UI/UX 改进
*   **全面汉化**：将界面中所有的英文标签、按钮、提示信息全部翻译为中文。

### 💻 代码变更 (Code Impact)
*   `frontend/src/components/TaskDetail.tsx`: **[NEW]** 新增任务详情弹窗组件。
*   `frontend/src/utils/cronHelper.ts`: **[NEW]** 新增 Cron 表达式转中文工具函数。
*   `frontend/src/App.tsx`: 集成 `TaskDetail`，在列表中应用 `formatCron`。

---

## 2026-01-09 - 项目初始化 (Initial Commit)

### 🚀 核心架构
*   **后端 (Backend)**: 
    *   基于 `Bun` + `ElysiaJS` 的高性能 API 服务。
    *   `SQLite` 数据库存储任务和用户配置。
    *   `node-schedule` 处理定时任务调度。
    *   `puppeteer` 集成 Tableau 截图功能。
    *   `dingtalk-robot-sender` 集成钉钉推送。
*   **前端 (Frontend)**:
    *   `React` + `Vite` + `TypeScript`。
    *   `TailwindCSS`用于样式设计。
    *   `Lucide React` 图标库。
*   **部署**: 支持 `PM2` 进程管理 (`ecosystem.config.cjs`)。

### 💻 核心文件
*   `index.ts`: 后端入口与 API 路由定义。
*   `src/services/`: 核心业务逻辑 (Scheduler, Tableau, DingTalk)。
*   `src/db/db.ts`: 数据库初始化与 Schema 定义。
