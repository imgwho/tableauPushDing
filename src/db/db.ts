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

  // Filiales table (分公司)
  db.run(`
    CREATE TABLE IF NOT EXISTS filiales (
      id INTEGER PRIMARY KEY, -- Using the provided specific IDs
      name TEXT NOT NULL
    );
  `);

  // Admins table (System Administrators)
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL -- Hashed password
    );
  `);

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dingtalk_userid TEXT NOT NULL,
      name TEXT NOT NULL,
      environment_id INTEGER NOT NULL,
      filiale_id INTEGER, -- Optional: NULL means headquarters or no filter
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
      FOREIGN KEY (filiale_id) REFERENCES filiales(id) ON DELETE SET NULL,
      UNIQUE(dingtalk_userid, environment_id)
    );
  `);

  // Try to migrate existing users table if filiale_id is missing
  try {
    db.run("ALTER TABLE users ADD COLUMN filiale_id INTEGER REFERENCES filiales(id) ON DELETE SET NULL");
    console.log("Migrated users table: Added filiale_id column.");
  } catch (e) {
    // Column likely exists, ignore
  }

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

  seedFiliales();
  seedAdmin();
  
  console.log("Database initialized.");
}

async function seedAdmin() {
    const adminExists = db.query("SELECT id FROM admins WHERE username = 'admin'").get();
    if (!adminExists) {
        const hashedPassword = await Bun.password.hash("admin123");
        db.query("INSERT INTO admins (username, password) VALUES ($username, $password)").run({
            $username: "admin",
            $password: hashedPassword
        });
        console.log("Seeded default admin user.");
    }
}

function seedFiliales() {
    const filiales = [
        { id: 1009, name: "南阳分公司" },
        { id: 1051, name: "重庆分公司" },
        { id: 1072, name: "贵阳乌当分公司" },
        { id: 1214, name: "武汉分公司" },
        { id: 1226, name: "招商部" },
        { id: 1227, name: "总部招商" },
        { id: 1534, name: "贵阳云岩分公司" },
        { id: 1632, name: "四川分公司" },
        { id: 1702, name: "鹏城分公司" },
        { id: 2033, name: "山东分公司" },
        { id: 2797, name: "招商自营" },
        { id: 3177, name: "天府分公司" },
        { id: 3467, name: "广州分公司" },
        { id: 3505, name: "天府一区" },
        { id: 3738, name: "成都金牛分公司" },
        { id: 3761, name: "富绿福重庆团队" },
        { id: 3825, name: "四川郎酒事业部" },
        { id: 3876, name: "四川酒满阁分公司" },
        { id: 3909, name: "富绿福武汉团队" },
        { id: 4060, name: "黄石分公司" },
        { id: 4113, name: "迎宾直播" },
        { id: 4174, name: "四川锦城分公司" },
        { id: 4202, name: "贵阳锦泷分公司" },
        { id: 4351, name: "长沙分公司" },
        { id: 4407, name: "铭酒中心" },
        { id: 4408, name: "四川锦富分公司" },
        { id: 4415, name: "四川招商蜀南直营分公司" },
        { id: 4417, name: "总部新媒体" }
    ];

    const insert = db.prepare("INSERT OR IGNORE INTO filiales (id, name) VALUES ($id, $name)");
    const insertMany = db.transaction(list => {
        for (const f of list) insert.run({ $id: f.id, $name: f.name });
    });
    insertMany(filiales);
    console.log(`Seeded ${filiales.length} filiales.`);
}

export default db;
