# Tableau Push Ding

Tableau Push Ding 是一个基于 Bun + Elysia + React 的定时推送系统，核心能力如下：
- 按计划从 Tableau Server 拉取工作簿视图图片
- 使用 `sharp` 进行图片拼接
- 通过钉钉企业应用消息推送到指定用户
- 提供 Web 管理后台（环境、用户、任务）

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
# 终端 1：后端
bun run index.ts

# 终端 2：前端
cd frontend
bun run dev --host
```

## 启动脚本说明
### `start.sh`（Linux/macOS）
- 作用：一键安装依赖并同时启动后端与前端。
- 日志：输出到根目录 `backend.log`、`frontend.log`。
- 停止：在脚本前台按 `Ctrl+C`，会尝试同时停止两个子进程。

### `start.ps1`（Windows PowerShell）
- 作用：与 `start.sh` 一致，适配 Windows。
- 运行方式：
```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```
- 日志：输出到根目录 `backend.log`、`frontend.log`。
- 停止：在脚本前台按 `Ctrl+C`。

## 建议运行环境
- 操作系统：优先 Linux（生产环境建议），开发环境可用 Linux/macOS/Windows。
- 运行时：Bun `>= 1.1.x`（建议在团队内固定版本）。
- 网络：需要访问 Tableau Server 与钉钉开放平台。
- 端口：后端默认 `3000`，前端默认 `5173`。
- 进程管理：生产环境建议使用 `pm2`（见 `ecosystem.config.cjs`）或容器化部署。

## 是否需要适配其他系统
- 当前项目已提供 `start.sh` 与 `start.ps1`，覆盖类 Unix 与 Windows 的本地启动。
- 如果后续要做更标准化交付，建议再补充：
  - `docker-compose.yml`（统一环境与启动命令）
  - CI 校验（lint/test/build）
  - 生产部署文档（含反向代理、日志轮转、备份策略）

## 环境变量说明
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

### 管理员初始化
项目不再内置默认管理员账号密码。启动时读取：
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` 或 `ADMIN_PASSWORD_HASH`

如果缺失，将跳过管理员初始化并记录警告日志。

## 常见问题
1. 启动提示 `Config file "userlist.env" not found`
- 这是预期行为，表示未提供私有配置文件；系统会安全跳过环境同步。

2. 无法获取 Tableau 工作簿
- 检查 `.env` 中的 Tableau 地址、站点 ID、PAT 配置。

3. 钉钉推送失败
- 检查 `DINGTALK_APP_KEY`、`DINGTALK_APP_SECRET`、`DINGTALK_AGENT_ID` 与用户 ID。

## 许可证
本项目采用 `AGPL-3.0-only` 许可证。
详见 [LICENSE](LICENSE)。
