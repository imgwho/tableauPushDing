import { Database } from "bun:sqlite";

const db = new Database("tableau_push.sqlite", { create: true });

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON;");

export function initDb() {
  console.log("Initializing database...");

  // Environments table
  db.run(`
    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      app_key TEXT NOT NULL,
      app_secret TEXT NOT NULL,
      agent_id TEXT NOT NULL
    );
  `);

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dingtalk_userid TEXT NOT NULL,
      name TEXT NOT NULL,
      environment_id INTEGER NOT NULL,
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
      UNIQUE(dingtalk_userid, environment_id)
    );
  `);

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, 
      cron_expression TEXT NOT NULL,
      workbook_names TEXT NOT NULL, -- JSON array of workbook names or comma separated
      target_user_ids TEXT NOT NULL, -- JSON array of local user IDs
      environment_id INTEGER NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
    );
  `);
  
  console.log("Database initialized.");
}

export default db;
