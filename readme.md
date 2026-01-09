# 项目说明文档 (Project Context for Refactoring)

## 1. 项目简介

**核心功能**：定时从 **Tableau Server** 获取指定的工作簿（Workbook）视图截图，将多个视图拼接成一张长图，并通过 **钉钉（DingTalk）** 机器人发送给指定的用户或部门。

## 2. 技术栈与依赖
*   **Runtime**: [Bun](https://bun.sh) (v1.0+)
*   **Database**: SQLite (`bun:sqlite`)

## 3. 核心业务流程 (Data Flow)
当一个定时任务 (`Task`) 触发时，系统执行以下流程：
1.  **环境加载**: 从数据库读取任务关联的 `Environment` 配置（钉钉 AppKey/AppSecret）。
2.  **Tableau 数据获取**:
    *   登录 Tableau Server (XML API)。
    *   根据任务配置的 `workbook_names` 查找对应的工作簿。
    *   获取该工作簿下所有的视图 (Views)。
    *   并发下载每个视图的高清截图 (PNG Buffer)。
3.  **图片处理**:
    *   如果一个看板有多页，下载的多张视图图片**垂直拼接**成一张长图。
4.  **钉钉推送**:
    *   获取钉钉 AccessToken。以及对应的环境，推送到对应的用户

5.  **管理后台**
    *   可以添加用户，添加任务选择工作簿，可以选择定时时间

## 4. 目录结构与关键文件
*   **Table `environments`**: 存储 自动同步。
*   **Table `tasks`**: 核心任务表，包含 Cron 表达式、目标工作簿名称、目标用户 ID 等。

## 5. 环境变量 (.env)
项目依赖以下环境变量连接 Tableau：
*   `TABLEAU_SERVER_URL`: Tableau 服务器地址。
*   `TABLEAU_SITE_ID`: 站点 ID。
*   `TABLEAU_TOKEN_NAME`: 个人访问令牌名称。
*   `TABLEAU_TOKEN_VALUE`: 个人访问令牌密钥。
* 钉钉应用凭证（AppKey, AppSecret, AgentId）从 `userlist.env`读取，分为正式环境和测试环境，测试环境1个用户 正式环境 4个用户，需要一开始的时候写入，


1. 管理后台的具体形式
      文档中提到的“管理后台”是需要开发一个可视化的 Web 前端界面（例如使用 React/Vue + 后端 API），还是仅仅指提供一组REST API
  供调用，或者是通过命令行交互 (CLI) 来管理任务和用户？

   2. `userlist.env` 的解析与环境同步
      我注意到 userlist.env 中包含了两组重复的 Key（如 DINGTALK_APP_KEY 分别用于测试和正式环境），这不是标准的 .env 文件格式。
       * 解析逻辑：是否需要我编写专门的解析器，根据文件中的注释（如 # 1、测试环境）来提取这两组配置？
       * 同步机制：readme.md 中提到的 Table environments “自动同步”，是否就是指在系统启动时，解析这个文件并将这两套配置（包括对应的 DINGTALK_USER_ID
         用户列表）导入/更新到 SQLite 数据库中？

   3. 图片拼接方案
      在 Bun 环境下将多张截图垂直拼接，你是否有偏好的技术方案？（例如使用 sharp 库，或者依赖系统安装的 ImageMagick？）

   4. Tableau 工作簿选择
      在“添加任务选择工作簿”时，是否需要系统先调用 Tableau API 获取所有可用的工作簿列表，并在后台（或接口）提供给用户进行选择？

   5. 关于接收推送的用户
      文档提到用户分为正式和测试环境的用户。在数据库设计中，这些用户是直接存储在 tasks 表的字段里（例如作为 JSON 数组），还是需要一张独立的 users
  表来管理，并与环境关联？

  请确认以上细节。

> 1、可视化的 Web 前端界面  2、根据文件中的注释（如 # 1、测试环境）来提取这两组配置，你应该在一开始创建2个环境
  1个是正式环境1个是测试环境，然后导入用户，只导入一次，后面可能新增用户  3、用sharp方案吧，不要依赖系统的库，后面可能要放到linux跑 4、对
  5、专门的users表更好一点