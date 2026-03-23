# Tableau Push Ding

Tableau Push Ding 是一个面向运营报表分发场景的自动化推送系统。
它会按计划从 Tableau Server 拉取视图截图，进行拼接处理，并通过钉钉企业应用消息推送给指定用户。

## 主要功能
- 定时任务调度：支持基于 Cron 的自动执行。
- Tableau 工作簿拉取：按任务配置获取工作簿视图图片。
- 图片处理：使用 `sharp` 进行多图拼接。
- 钉钉推送：自动获取 Token、上传图片并发送工作通知。
- 环境管理：支持多环境（例如测试/正式）配置隔离。
- 用户管理：支持按环境维护接收用户。
- 管理后台：提供任务、用户、环境的可视化管理界面。

## 技术栈
- 后端：Bun、Elysia、SQLite
- 前端：React、Vite、TypeScript
- 外部集成：Tableau REST API、DingTalk OpenAPI

## 项目结构
```text
.
|- index.ts                      # 后端入口
|- src/
|  |- db/db.ts                   # SQLite 初始化与表结构
|  |- services/                  # 调度、Tableau、钉钉、配置同步
|  '- utils/envParser.ts         # userlist.env 解析器
|- frontend/                     # 前端项目
|- start.sh                      # Linux/macOS 一键启动脚本
|- start.ps1                     # Windows 一键启动脚本
|- .env.example                  # 可提交的环境变量模板
|- userlist.example.env          # 可提交的钉钉映射模板
'- LICENSE
```

## 快速开始
1. 安装依赖
```bash
bun install
cd frontend && bun install
```

2. 生成本地私有配置
```bash
cp .env.example .env
cp userlist.example.env userlist.env
```

3. 填写 `.env` 和 `userlist.env` 中的真实配置。

4. 启动服务
```bash
# 方式一：手动启动
# 终端 1
bun run index.ts
# 终端 2
cd frontend
bun run dev --host

# 方式二：脚本启动
# Linux/macOS
./start.sh
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

## 运行环境建议
- 操作系统：生产环境建议 Linux；开发环境可用 Linux/macOS/Windows。
- Bun 版本：建议 `>= 1.1.x`，并在团队内固定版本。
- 网络要求：需可访问 Tableau Server 与钉钉开放平台。
- 默认端口：后端 `3000`，前端 `5173`。
- 生产进程管理：建议使用 `pm2`（见 `ecosystem.config.cjs`）或容器化部署。

## 配置说明
### `.env`
- `TABLEAU_SERVER_URL`
- `TABLEAU_SITE_ID`
- `TABLEAU_TOKEN_NAME`
- `TABLEAU_TOKEN_VALUE`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` 或 `ADMIN_PASSWORD_HASH`（管理员初始化二选一）
- `USERLIST_ENV_PATH`（可选，默认 `userlist.env`）

### `userlist.env`
支持的环境段头格式：
- `# ENV: Production`
- `# ENVIRONMENT: Test`
- `# 1. Test`
- `# 1) Test`

每个环境段支持以下字段：
- `DINGTALK_APP_KEY`
- `DINGTALK_APP_SECRET`
- `DINGTALK_AGENT_ID`
- `DINGTALK_USER_ID`（格式：`姓名:userid,姓名:userid`）

## 安全与开源发布
以下文件不要提交到 GitHub：
- `.env`
- `userlist.env`
- `*.sqlite`
- `*.log`
- `frontend/dist/`
- `node_modules/`

以上规则已由 `.gitignore` 覆盖。

## 许可证
本项目采用 `AGPL-3.0-only` 许可证。
详见 [LICENSE](LICENSE)。
