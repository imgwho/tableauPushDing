import { Cron } from "croner";
import db from "../db/db";
import { tableauService } from "./tableauService";
import { imageService } from "./imageService";
import { dingtalkService } from "./dingtalkService";

// Keep track of scheduled tasks to allow stopping/updating them
const activeTasks = new Map<number, Cron>();

export const schedulerService = {
  initScheduler,
  reloadAllTasks,
  triggerTaskManual
};

async function initScheduler() {
  console.log("Initializing scheduler (Croner)...");
  await reloadAllTasks();
}

async function reloadAllTasks() {
  // Stop existing tasks
  for (const [id, job] of activeTasks) {
    job.stop();
  }
  activeTasks.clear();

  // Load enabled tasks from DB
  const tasks = db.query(`
    SELECT t.*, e.app_key, e.app_secret, e.agent_id 
    FROM tasks t
    JOIN environments e ON t.environment_id = e.id
    WHERE t.enabled = 1
  `).all() as any[];

  console.log(`Found ${tasks.length} enabled tasks.`);

  for (const task of tasks) {
    try {
        // Croner automatically validates the pattern
        const job = new Cron(task.cron_expression, {
            name: `Task-${task.id}`,
            protect: true, // Prevent overlapping executions
            catch: true    // Catch unhandled errors
        }, () => {
            console.log(`Executing scheduled task ${task.id} (${task.name}) at ${new Date().toISOString()}`);
            executeTask(task);
        });
        
        activeTasks.set(task.id, job);
        console.log(`Scheduled task ${task.id}: ${task.name} [${task.cron_expression}] - Next run: ${job.nextRun()}`);
    } catch (e) {
        console.error(`Error scheduling task ${task.id} with pattern '${task.cron_expression}':`, e);
    }
  }
}

async function triggerTaskManual(taskId: number) {
    const task = db.query(`
        SELECT t.*, e.app_key, e.app_secret, e.agent_id 
        FROM tasks t
        JOIN environments e ON t.environment_id = e.id
        WHERE t.id = $id
    `).get({ $id: taskId }) as any;

    if (!task) {
        throw new Error(`Task ${taskId} not found.`);
    }

    console.log(`Manually triggering task ${task.id}`);
    // Execute async without awaiting to return response quickly
    executeTask(task).catch(err => console.error(`Manual trigger failed for task ${taskId}:`, err));
}

async function executeTask(task: any) {
    try {
        console.log(`[Task ${task.id}] Starting execution...`);

        // 1. Get Target Workbook & Views
        let targetWorkbooks: string[] = [];
        try {
            targetWorkbooks = JSON.parse(task.workbook_names);
        } catch {
            targetWorkbooks = [task.workbook_names]; 
        }

        // 2. Fetch all Workbooks from Tableau to find IDs
        const allWorkbooks = await tableauService.getWorkbooks();
        
        const selectedWorkbooks = allWorkbooks.filter((wb: any) => targetWorkbooks.includes(wb.name));

        if (selectedWorkbooks.length === 0) {
            console.warn(`[Task ${task.id}] No matching workbooks found for names: ${targetWorkbooks.join(', ')}`);
            return;
        }

        for (const wb of selectedWorkbooks) {
            console.log(`[Task ${task.id}] Processing workbook: ${wb.name}`);
            
            const views = await tableauService.getViewsForWorkbook(wb.id);
            if (views.length === 0) {
                console.log(`[Task ${task.id}] No views found for workbook ${wb.name}`);
                continue;
            }

            console.log(`[Task ${task.id}] Downloading ${views.length} views...`);
            // Download in parallel
            const imageBuffers = await Promise.all(views.map((v: any) => tableauService.getViewImage(v.id)));
            
            console.log(`[Task ${task.id}] Stitching images...`);
            const stitchedImage = await imageService.stitchImagesVertically(imageBuffers);

            // 3. Send to DingTalk
            console.log(`[Task ${task.id}] Uploading to DingTalk...`);
            const token = await dingtalkService.getAccessToken(task.app_key, task.app_secret);
            const mediaId = await dingtalkService.uploadImage(token, stitchedImage);

            // Get User DingTalk IDs
            let userIds: string[] = [];
            try {
                const localUserIds = JSON.parse(task.target_user_ids); 
                if (Array.isArray(localUserIds) && localUserIds.length > 0) {
                    const placeholders = localUserIds.map(() => '?').join(',');
                    const users = db.query(`SELECT dingtalk_userid FROM users WHERE id IN (${placeholders})`).all(...localUserIds) as any[];
                    userIds = users.map(u => u.dingtalk_userid);
                }
            } catch (e) {
                console.error(`[Task ${task.id}] Error parsing target_user_ids:`, e);
            }

            const now = new Date();
            const pushTime = now.toLocaleString('zh-CN', { hour12: false });
            const title = `${wb.name}`;
            const messageText = `推送时间：${pushTime}`;

            if (userIds.length > 0) {
                console.log(`[Task ${task.id}] Sending to ${userIds.length} users...`);
                await dingtalkService.sendWorkNotification(token, task.agent_id, userIds, mediaId, title, messageText);
            } else {
                console.warn(`[Task ${task.id}] No valid users found to send.`);
            }
        }

        console.log(`[Task ${task.id}] Execution finished.`);

    } catch (error) {
        console.error(`[Task ${task.id}] Execution failed:`, error);
    }
}