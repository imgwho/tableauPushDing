import fs from 'node:fs';

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
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const environments: EnvironmentConfig[] = [];
  let currentEnv: Partial<EnvironmentConfig> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect Environment Header (e.g., "# 1、测试环境")
    const envMatch = trimmed.match(/^#\s*\d+、(.+)/);
    if (envMatch) {
      if (currentEnv && currentEnv.name) {
        // Push previous env if complete (validation logic can be added)
         environments.push(currentEnv as EnvironmentConfig);
      }
      currentEnv = {
        name: envMatch[1].trim(),
        users: []
      };
      continue;
    }

    if (!currentEnv) continue;

    // Key-Value pairs
    if (trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      
      // Ignore comments in value if any? (Assuming simple format)
      
      switch (key.trim()) {
        case 'DINGTALK_APP_KEY':
          currentEnv.appKey = value;
          break;
        case 'DINGTALK_APP_SECRET':
          currentEnv.appSecret = value;
          break;
        case 'DINGTALK_AGENT_ID':
          currentEnv.agentId = value;
          break;
        case 'DINGTALK_USER_ID':
          // Format: 姓名:UserID,姓名:UserID
          currentEnv.users = value.split(',').map(pair => {
            const [name, userid] = pair.split(':');
            if (name && userid) {
              return { name: name.trim(), userid: userid.trim() };
            }
            return null;
          }).filter(u => u !== null) as DingTalkUser[];
          break;
      }
    }
  }

  // Push the last one
  if (currentEnv && currentEnv.name) {
    environments.push(currentEnv as EnvironmentConfig);
  }

  return environments;
}
