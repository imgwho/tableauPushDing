# 需求完成追踪文档 (Requirements Tracking)

本文档用于实时追踪项目的需求理解与完成情况。

## 项目概览
**目标**: 定时从 Tableau Server 获取工作簿截图，拼接成长图，通过钉钉机器人推送给指定用户。
**技术栈**: Bun, SQLite, React, Sharp。

---

## 任务进度表

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

---

## 已完成事项 (Completed Log)
*   *2025-12-11*: 初始需求分析，确认技术栈，解析 `.env` 和 `userlist.env` 结构，制定开发计划。
*   *2025-12-11*: 完成后端核心服务（Tableau/DingTalk/Scheduler/Image）及 API 开发。
*   *2025-12-11*: 完成前端 React 管理后台开发。
*   *2025-12-11*: 修复 Tableau PAT 认证问题 (401) 并添加用户管理功能。
