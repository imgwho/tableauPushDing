# 变更日志

本文档记录项目的重要变更。

## [2026-03-23]

### 安全
- 移除硬编码默认管理员账号密码。
- 管理员初始化改为必须从环境变量读取：
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD` 或 `ADMIN_PASSWORD_HASH`
- 当管理员初始化变量缺失时，启动阶段增加明确告警。

### 稳定性
- `syncConfigToDb` 在 `userlist.env` 缺失时不再报错中断，改为安全跳过。
- 新增 `USERLIST_ENV_PATH`，支持自定义用户/环境映射文件路径。
- 当配置文件存在但没有有效环境段时，增加提示日志。

### 解析器
- `userlist.env` 解析器支持多种段头格式：
  - `# ENV: Production`
  - `# ENVIRONMENT: Test`
  - `# 1. Test`
  - `# 1) Test`
- 非段头注释行会被安全忽略。

### 文档与发布
- 重写主文档，统一为可发布版本。
- 新增可公开提交的模板文件：
  - `.env.example`
  - `userlist.example.env`
- 补充敏感文件提交边界说明。
- 新增 `AGPL-3.0-only` 许可证文件。
- `package.json` 增加 `license: AGPL-3.0-only`。
- 全部文档改为中文。
- 补充启动脚本说明、建议运行环境与跨系统适配建议。
- 新增 Windows 启动脚本 `start.ps1`。

## [2026-01-10]

### 功能
- 新增按分公司维度的数据隔离推送与分组推送。
- 增强用户管理能力（编辑等）。
- 新增分公司字典数据与 `GET /api/filiales` 接口。

### 交互
- 替换浏览器原生弹窗为站内 Toast 和确认弹窗。
- 新增任务详情弹窗并优化任务列表可读性。
- 优化中文界面体验。

### 任务管理
- 新增任务更新接口 `PUT /api/tasks/:id`。
- 新增任务启用/禁用状态控制。
- 支持 Cron 表达式回填编辑表单。

## [2025-12-11]

### 初始版本
- 基于 Bun + Elysia 搭建后端。
- 使用 SQLite 持久化环境、用户、任务。
- 实现 Tableau 登录/工作簿/视图/图片获取流程。
- 集成钉钉 Token、素材上传、消息发送流程。
- 基于 React + Vite + TypeScript 搭建前端。
