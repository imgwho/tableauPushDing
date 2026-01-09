export interface Environment {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    dingtalk_userid: string;
    env_name: string; // From join
    environment_id: number; // Actual foreign key
}

export interface Workbook {
    id: string;
    name: string;
    contentUrl: string;
    projectId: string;
    projectName: string;
}

export interface Task {
    id: number;
    name: string;
    cron_expression: string;
    workbook_names: string; // JSON string or comma sep from DB, but we might parse it
    target_user_ids: string; // JSON string
    environment_id: number;
    env_name: string;
    enabled: number;
    created_at: string;
}

export interface CreateTaskDTO {
    name: string;
    cron_expression: string;
    workbook_names: string[];
    target_user_ids: number[];
    environment_id: number;
}

export interface CreateUserDTO {
    dingtalk_userid: string;
    name: string;
    environment_id: number;
}