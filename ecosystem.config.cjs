module.exports = {
  apps: [
    {
      name: "tableau-push-backend",
      interpreter: "bun",
      script: "index.ts",
      env: {
        PORT: 3000,
        NODE_ENV: "production"
      }
    },
    {
      name: "tableau-push-frontend",
      cwd: "./frontend",
      script: "bun",
      args: "run dev --host",
      interpreter: "none", // 重要：告诉 PM2 不要把 script 当作 js 文件去解析，而是直接执行命令
      env: {
        PORT: 5173
      }
    }
  ]
};