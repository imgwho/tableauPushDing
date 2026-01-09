import { initDb } from "./src/db/db";
import { syncConfigToDb } from "./src/services/configService";
import { tableauService } from "./src/services/tableauService";
import { schedulerService } from "./src/services/schedulerService";
import db from "./src/db/db";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

// 1. Initialize Database
initDb();

// 2. Sync Configuration from userlist.env
try {
  syncConfigToDb();
} catch (error) {
  console.error("Failed to sync configuration:", error);
}

// 3. Initialize Scheduler
schedulerService.initScheduler();

// 4. Start Web Server
const app = new Elysia()
  .use(cors())
  .get("/", () => "Tableau Push Ding Service is Running")
  
  // --- API Routes ---
  .group('/api', app => app
    // Environments
    .get('/environments', () => {
        return db.query("SELECT id, name FROM environments").all();
    })

    // Filiales (分公司)
    .get('/filiales', () => {
        return db.query("SELECT id, name FROM filiales ORDER BY id").all();
    })

    // Users
    .get('/users', () => {
        return db.query(`
            SELECT 
                u.id, u.name, u.dingtalk_userid, 
                e.name as env_name, u.environment_id,
                f.name as filiale_name, u.filiale_id
            FROM users u 
            JOIN environments e ON u.environment_id = e.id
            LEFT JOIN filiales f ON u.filiale_id = f.id
        `).all();
    })
    .post('/users', ({ body }) => {
        const { dingtalk_userid, name, environment_id, filiale_id } = body as any;
        try {
            db.query(`
                INSERT INTO users (dingtalk_userid, name, environment_id, filiale_id)
                VALUES ($dingtalk_userid, $name, $environment_id, $filiale_id)
            `).run({
                $dingtalk_userid: dingtalk_userid,
                $name: name,
                $environment_id: environment_id,
                $filiale_id: filiale_id || null
            });
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }, {
        body: t.Object({
            dingtalk_userid: t.String(),
            name: t.String(),
            environment_id: t.Number(),
            filiale_id: t.Optional(t.Nullable(t.Number()))
        })
    })

    .put('/users/:id', ({ params, body }) => {
        const { dingtalk_userid, name, environment_id, filiale_id } = body as any;
        try {
            db.query(`
                UPDATE users 
                SET dingtalk_userid = $dingtalk_userid,
                    name = $name,
                    environment_id = $environment_id,
                    filiale_id = $filiale_id
                WHERE id = $id
            `).run({
                $id: params.id,
                $dingtalk_userid: dingtalk_userid,
                $name: name,
                $environment_id: environment_id,
                $filiale_id: filiale_id || null
            });
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }, {
        params: t.Object({
            id: t.Numeric()
        }),
        body: t.Object({
            dingtalk_userid: t.String(),
            name: t.String(),
            environment_id: t.Number(),
            filiale_id: t.Optional(t.Nullable(t.Number()))
        })
    })

    .delete('/users/:id', ({ params }) => {
        db.query("DELETE FROM users WHERE id = $id").run({ $id: params.id });
        return { success: true };
    })

    // Tableau Workbooks (Real-time fetch)
    .get('/workbooks', async () => {
        try {
            return await tableauService.getWorkbooks();
        } catch (error: any) {
            console.error("API Error caught:", error);
            return { 
                error: "Failed to fetch workbooks from Tableau",
                details: String(error),
                message: error?.message || "No message",
                stack: error?.stack,
                raw: JSON.stringify(error) // Axios errors often have circular refs, but let's try or empty
            };
        }
    })

    // Tasks
    .get('/tasks', () => {
        return db.query(`
            SELECT t.*, e.name as env_name 
            FROM tasks t
            JOIN environments e ON t.environment_id = e.id
            ORDER BY t.created_at DESC
        `).all();
    })

    .post('/tasks', ({ body }) => {
        const { name, cron_expression, workbook_names, target_user_ids, environment_id } = body as any;
        
        try {
            db.query(`
                INSERT INTO tasks (name, cron_expression, workbook_names, target_user_ids, environment_id)
                VALUES ($name, $cron, $wbs, $users, $env)
            `).run({
                $name: name,
                $cron: cron_expression,
                $wbs: JSON.stringify(workbook_names), // Ensure JSON
                $users: JSON.stringify(target_user_ids),
                $env: environment_id
            });
            
            schedulerService.reloadAllTasks();
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }, {
        body: t.Object({
            name: t.String(),
            cron_expression: t.String(),
            workbook_names: t.Array(t.String()),
            target_user_ids: t.Array(t.Number()), // IDs from users table
            environment_id: t.Number()
        })
    })

    .delete('/tasks/:id', ({ params }) => {
        db.query("DELETE FROM tasks WHERE id = $id").run({ $id: params.id });
        schedulerService.reloadAllTasks();
        return { success: true };
    })

    .put('/tasks/:id', ({ params, body }) => {
        const { name, cron_expression, workbook_names, target_user_ids, environment_id, enabled } = body as any;
        try {
            db.query(`
                UPDATE tasks 
                SET name = $name, 
                    cron_expression = $cron, 
                    workbook_names = $wbs, 
                    target_user_ids = $users, 
                    environment_id = $env,
                    enabled = $enabled
                WHERE id = $id
            `).run({
                $id: params.id,
                $name: name,
                $cron: cron_expression,
                $wbs: JSON.stringify(workbook_names),
                $users: JSON.stringify(target_user_ids),
                $env: environment_id,
                $enabled: enabled
            });
            
            schedulerService.reloadAllTasks();
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }, {
        params: t.Object({
            id: t.Numeric()
        }),
        body: t.Object({
            name: t.String(),
            cron_expression: t.String(),
            workbook_names: t.Array(t.String()),
            target_user_ids: t.Array(t.Number()),
            environment_id: t.Number(),
            enabled: t.Number() // 0 or 1
        })
    })

    .post('/tasks/:id/trigger', async ({ params }) => {
        try {
            await schedulerService.triggerTaskManual(Number(params.id));
            return { success: true, message: "Task triggered in background" };
        } catch (e: any) {
            return { error: e.message };
        }
    })
  )
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} (v2 - Debug Mode)`);