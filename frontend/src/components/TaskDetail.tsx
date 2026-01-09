import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Task, Environment, User, Workbook } from '../types';
import { X, Loader2, Clock, Users, FileBarChart, Server } from 'lucide-react';
import { formatCron } from '../utils/cronHelper';

interface TaskDetailProps {
    task: Task;
    onClose: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose }) => {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Parse existing data
    const workbookNames: string[] = (() => {
        try {
            const parsed = JSON.parse(task.workbook_names);
            return Array.isArray(parsed) ? parsed : [task.workbook_names];
        } catch {
            return [task.workbook_names];
        }
    })();

    const targetUserIds: number[] = (() => {
        try {
            const parsed = JSON.parse(task.target_user_ids);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [envRes, userRes] = await Promise.all([
                    axios.get('/api/environments'),
                    axios.get('/api/users'),
                ]);
                setEnvironments(envRes.data);
                setUsers(userRes.data);
            } catch (error) {
                console.error("Failed to load details data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getEnvironmentName = (id: number) => {
        const env = environments.find(e => e.id === id);
        return env ? env.name : `ID: ${id}`;
    };

    const getTargetUsers = () => {
        return targetUserIds.map(id => {
            const user = users.find(u => u.id === id);
            return user ? user : { id, name: `未知用户 (ID: ${id})`, dingtalk_userid: '?', env_name: '?' };
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        任务详情
                        <span className="text-sm font-normal px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                            #{task.id}
                        </span>
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"><X /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : (
                        <>
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">任务名称</label>
                                    <div className="text-lg font-medium">{task.name}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">所属环境</label>
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium">{getEnvironmentName(task.environment_id)}</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-700" />

                            {/* Cron Info */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">推送时间配置</label>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-md border border-zinc-100 dark:border-zinc-700 flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-lg">{formatCron(task.cron_expression)}</span>
                                        <code className="font-mono text-[10px] text-zinc-400">
                                            {task.cron_expression}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Workbooks */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                    <span>包含工作簿</span>
                                    <span className="text-zinc-400 normal-case font-normal">{workbookNames.length} 个</span>
                                </label>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                                    {workbookNames.length > 0 ? (
                                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
                                            {workbookNames.map((name, idx) => (
                                                <li key={idx} className="p-3 flex items-center gap-3 text-sm">
                                                    <FileBarChart className="h-4 w-4 text-green-600" />
                                                    <span>{name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-zinc-500 text-sm italic">未选择工作簿</div>
                                    )}
                                </div>
                            </div>

                            {/* Users */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                    <span>接收用户</span>
                                    <span className="text-zinc-400 normal-case font-normal">{targetUserIds.length} 人</span>
                                </label>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                                    {targetUserIds.length > 0 ? (
                                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
                                            {getTargetUsers().map((user: any, idx) => (
                                                <li key={idx} className="p-3 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                                            {user.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-xs text-zinc-500 font-mono">{user.dingtalk_userid}</div>
                                                        </div>
                                                    </div>
                                                    {user.env_name && (
                                                        <span className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                                            {user.env_name}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-zinc-500 text-sm italic">未选择用户</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-lg transition"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
