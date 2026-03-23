# 前端说明（React + Vite）

本目录是 Tableau Push Ding 的管理后台前端。

## 常用命令
- `bun run dev`：启动开发服务器
- `bun run build`：类型检查并构建生产产物
- `bun run preview`：本地预览生产构建
- `bun run lint`：执行 ESLint

## 后端联调
本地开发时，Vite 会将 API 请求代理到 `http://localhost:3000`（见 `vite.config.ts`）。

## 约束
- 不要提交 `dist/` 目录。
- 前后端字段变更时，保持 `index.ts` 与 `src/types.ts` 同步。
