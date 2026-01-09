# Project Documentation & Changelog

本文档整合了项目的版本演进历史 (Changelog) 以及原始需求与完成情况 (Requirements)。

---

## 📅 Version History (Changelog)

### 2026-01-09 - 分公司数据隔离推送与用户管理增强

#### ✨ 新功能 (Features)
*   **分公司维度推送 (Bursting)**：
    *   实现了基于 `filialeid` 的数据隔离截图推送。
    *   **智能分组**：任务执行时会自动按用户所属分公司分组，同一个分公司仅截一次图，提升效率。
    *   **动态过滤**：向 Tableau 请求图片时自动追加 `vf_filialeid` 过滤参数。
*   **用户编辑功能**：支持修改现有用户的姓名、钉钉 ID、分公司归属及所属环境。
*   **分公司管理**：系统内置了四川、重庆、广东等 28 个分公司的数据映射。

#### 💻 代码变更 (Code Impact)
*   `src/db/db.ts`: 
    *   新增 `filiales` 表。
    *   `users` 表新增 `filiale_id` 外键。
    *   内置 28 个分公司的种子数据初始化逻辑。
*   `index.ts`: 
    *   新增 `GET /api/filiales` 接口。
    *   新增 `PUT /api/users/:id` 和 `DELETE /api/users/:id` 接口。
*   `src/services/tableauService.ts`: `getViewImage` 方法支持传入 `filters` 参数，生成 `vf_` 前缀的 Tableau 过滤 URL。
*   `src/services/schedulerService.ts`: 重构 `executeTask` 核心逻辑，由“单图群发”升级为“分组过滤截图精准推送”。
*   `frontend/src/components/UserForm.tsx`: 支持编辑模式，新增分公司下拉选择框。
*   `frontend/src/components/UserManager.tsx`: 列表增加“分公司”列，新增“编辑”操作入口。

---

### 2026-01-09 - UI/UX 深度优化与交互重构

#### 🎨 UI/UX 改进 (User Experience)
*   **告别原生弹窗**：移除了所有浏览器原生的 `alert()` 和 `confirm()`。
    *   **通知**：操作成功/失败现在通过右下角的 `Toast` 消息提示。
    *   **确认**：删除操作现在展示自定义的 `ConfirmModal`，风格统一且美观。
*   **回归 Modal 布局**：放弃全屏页面跳转，将新建、编辑、详情、用户管理等功能还原为 **Modal 弹出层**，保证用户不离开当前上下文，操作更连贯。
*   **环境视觉区分**：
    *   **正式环境**：橙红色标记，醒目提示。
    *   **测试/开发环境**：绿色标记，表示安全。
    *   **默认环境**：紫色标记。

#### 💻 代码变更 (Code Impact)
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

### 2026-01-09 - 任务修改与状态控制

#### ✨ 新功能 (Features)
*   **任务编辑**：支持修改现有任务的所有配置（名称、环境、时间、用户、工作簿）。
*   **启用/禁用**：新增任务状态开关。
    *   禁用后的任务在列表中会变灰并显示虚线边框。
    *   禁用任务无法被手动触发或自动调度。
*   **智能关联**：在编辑任务时，如果切换了“环境”，会自动清空已选的“用户”和“工作簿”，防止数据不一致。
*   **Cron 反向解析**：编辑任务时，自动将后台的 Cron 表达式（如 `0 9 * * 1-5`）解析回表单的 UI 控件状态。

#### 💻 代码变更 (Code Impact)
*   `index.ts`:
    *   新增 `PUT /api/tasks/:id` 接口。
    *   更新后自动调用 `schedulerService.reloadAllTasks()` 重启调度任务。
*   `frontend/src/components/TaskForm.tsx`:
    *   重构为支持 `initialData` 传入，实现“编辑模式”。
    *   新增 `parseCron` 函数处理 Cron 到 UI 的映射。
*   `frontend/src/types.ts`: 新增 `UpdateTaskDTO` 类型，包含 `enabled` 字段。

---

### 2026-01-09 - 界面汉化与详情查看

#### ✨ 新功能 (Features)
*   **详情查看**：点击任务卡片上的 👁️ 图标，可查看任务的详细配置。
    *   展示解析后的具体用户列表（头像+姓名）。
    *   展示完整的工作簿列表。
*   **人性化时间**：将复杂的 Cron 表达式（`0 9 * * *`）转换为中文描述（“每天 09:00”）。

#### 🎨 UI/UX 改进
*   **全面汉化**：将界面中所有的英文标签、按钮、提示信息全部翻译为中文。

#### 💻 代码变更 (Code Impact)
*   `frontend/src/components/TaskDetail.tsx`: **[NEW]** 新增任务详情弹窗组件。
*   `frontend/src/utils/cronHelper.ts`: **[NEW]** 新增 Cron 表达式转中文工具函数。
*   `frontend/src/App.tsx`: 集成 `TaskDetail`，在列表中应用 `formatCron`。

---

### 2026-01-09 - 项目初始化 (Initial Commit)

#### 🚀 核心架构
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

#### 💻 核心文件
*   `index.ts`: 后端入口与 API 路由定义。
*   `src/services/`: 核心业务逻辑 (Scheduler, Tableau, DingTalk)。
*   `src/db/db.ts`: 数据库初始化与 Schema 定义。

---
---

## ✅ Original Requirements & Implementation Status (原始需求与完成情况)

### 1. 基础设施与配置 (Infrastructure & Config)
- [x] **项目初始化**: 配置 Bun 环境，安装基础依赖 (bun, elysia/express, drizzle/better-sqlite3 等)。
- [x] **数据库设计 (SQLite)**:
    - [x] 设计 `environments` 表 (存储 DingTalk AppKey/Secret, AgentId)。
    - [x] 设计 `users` 表 (存储 DingTalk UserID, 姓名, 关联环境)。
    - [x] 设计 `tasks` 表 (存储 Cron 表达式, Workbook info, 目标用户 IDs)。
- [x] **环境配置同步 (Env Parser)**:
    - [x] 编写解析器处理 `userlist.env` (非标准多环境格式)。
    - [x] 实现启动时自动同步：将环境配置和用户列表导入 SQLite。

### 2. 核心后端服务 (Core Backend)
- [x] **Tableau 客户端 (API Wrapper)**:
    - [x] 实现认证 (Personal Access Token)。
    - [x] 获取站点下的所有工作簿 (List Workbooks)。
    - [x] 获取工作簿下的所有视图 (List Views)。
    - [x] 并发下载视图截图 (Download Image)。
- [x] **图片处理 (Image Processing)**:
    - [x] 使用 `sharp` 库实现多张图片垂直拼接。
- [x] **钉钉服务 (DingTalk Service)**:
    - [x] 获取并缓存 AccessToken。
    - [x] 封装发送工作通知消息接口 (支持媒体文件上传/推送)。
- [x] **任务调度 (Scheduler)**:
    - [x] 集成 Cron 库。
    - [x] 实现任务执行逻辑：触发 -> Tableau截图 -> 拼接 -> 钉钉推送。

### 3. 管理后台 (Admin Dashboard)
- [x] **Web API 开发**:
    - [x] API: 获取用户列表 (按环境)。
    - [x] API: 获取 Tableau 工作簿列表 (实时)。
    - [x] API: 任务管理 (增删改查)。
    - [x] API: 用户管理 (新增用户)。
- [x] **前端开发 (Vite + React)**:
    - [x] **仪表盘**: 展示现有定时任务列表。
    - [x] **用户管理**: 查看和添加钉钉接收用户。
    - [x] **任务编辑器**:
        - [x] 环境选择。
        - [x] 工作簿下拉选择 (级联)。
        - [x] 接收用户多选。
        - [x] Cron 表达式生成/输入。