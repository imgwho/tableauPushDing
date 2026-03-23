import fs from "node:fs";

export interface DingTalkUser {
  name: string;
  userid: string;
}

export interface EnvironmentConfig {
  name: string;
  appKey: string;
  appSecret: string;
  agentId: string;
  users: DingTalkUser[];
}

export function parseUserListEnv(filePath: string): EnvironmentConfig[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  const environments: EnvironmentConfig[] = [];
  let currentEnv: Partial<EnvironmentConfig> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Environment header formats:
    // - # ENV: Production
    // - # ENVIRONMENT: Test
    // - # 1. Test
    // - # 1) Test
    const envMatch =
      trimmed.match(/^#\s*(?:ENV|ENVIRONMENT)\s*[:=]\s*(.+)$/i) ||
      trimmed.match(/^#\s*\d+\s*[\W_]*\s*(.+)$/);

    if (envMatch) {
      if (currentEnv?.name) {
        environments.push(currentEnv as EnvironmentConfig);
      }

      currentEnv = {
        name: envMatch[1].trim(),
        users: []
      };
      continue;
    }

    // Ignore non-header comment lines.
    if (trimmed.startsWith("#")) continue;

    if (!currentEnv) continue;
    if (!trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    switch (key.trim()) {
      case "DINGTALK_APP_KEY":
        currentEnv.appKey = value;
        break;
      case "DINGTALK_APP_SECRET":
        currentEnv.appSecret = value;
        break;
      case "DINGTALK_AGENT_ID":
        currentEnv.agentId = value;
        break;
      case "DINGTALK_USER_ID":
        currentEnv.users = value
          .split(",")
          .map((pair) => {
            const [name, userid] = pair.split(":");
            if (!name || !userid) return null;
            return { name: name.trim(), userid: userid.trim() };
          })
          .filter((u): u is DingTalkUser => u !== null);
        break;
      default:
        break;
    }
  }

  if (currentEnv?.name) {
    environments.push(currentEnv as EnvironmentConfig);
  }

  return environments;
}
