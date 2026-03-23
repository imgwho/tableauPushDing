import fs from "node:fs";
import db from "../db/db";
import { parseUserListEnv } from "../utils/envParser";

export function syncConfigToDb(filePath = process.env.USERLIST_ENV_PATH || "userlist.env") {
  if (!fs.existsSync(filePath)) {
    console.warn(`Config file "${filePath}" not found. Skipping environment sync.`);
    return;
  }

  const envs = parseUserListEnv(filePath);
  if (envs.length === 0) {
    console.warn(`No valid environments found in "${filePath}". Skipping environment sync.`);
    return;
  }
  
  const insertEnvStmt = db.prepare(`
    INSERT INTO environments (name, app_key, app_secret, agent_id)
    VALUES ($name, $app_key, $app_secret, $agent_id)
    ON CONFLICT(name) DO UPDATE SET
      app_key = excluded.app_key,
      app_secret = excluded.app_secret,
      agent_id = excluded.agent_id
    RETURNING id;
  `);

  const insertUserStmt = db.prepare(`
    INSERT INTO users (dingtalk_userid, name, environment_id)
    VALUES ($userid, $name, $env_id)
    ON CONFLICT(dingtalk_userid, environment_id) DO UPDATE SET
      name = excluded.name;
  `);

  const getEnvIdStmt = db.prepare("SELECT id FROM environments WHERE name = $name");

  db.transaction(() => {
    for (const env of envs) {
      console.log(`Syncing environment: ${env.name}`);
      let envId: number | bigint | undefined;
      
      try {
        const result = insertEnvStmt.get({
            $name: env.name,
            $app_key: env.appKey,
            $app_secret: env.appSecret,
            $agent_id: env.agentId
        }) as { id: number };
        envId = result.id;
      } catch (e) {
          // In case upsert returns nothing or fails (though RETURNING should work)
          const row = getEnvIdStmt.get({ $name: env.name }) as { id: number };
          envId = row.id;
      }

      if (envId) {
        for (const user of env.users) {
          insertUserStmt.run({
            $userid: user.userid,
            $name: user.name,
            $env_id: envId
          });
        }
        console.log(`Synced ${env.users.length} users for ${env.name}`);
      }
    }
  })();
  
  console.log("Configuration sync complete.");
}
