import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Environment, User, Workbook, UpdateTaskDTO, Task } from '../types';
import { X, Loader2 } from 'lucide-react';

interface TaskFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Task;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, initialData }) => {
    const isEdit = !!initialData;
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Cron Builder State
    const [cronType, setCronType] = useState<'daily' | 'workdays' | 'weekly' | 'custom'>('workdays');
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);

    const [formData, setFormData] = useState<UpdateTaskDTO>({
        name: initialData?.name || '',
        cron_expression: initialData?.cron_expression || '0 9 * * 1-5', 
        workbook_names: initialData ? JSON.parse(initialData.workbook_names) : [],
        target_user_ids: initialData ? JSON.parse(initialData.target_user_ids) : [],
        environment_id: initialData?.environment_id || 0,
        enabled: initialData?.enabled ?? 1
    });

    // Helper: Reverse Cron Parsing
    const parseCron = (cron: string) => {
        const parts = cron.split(' ');
        if (parts.length < 5) {
            setCronType('custom');
            return;
        }

        const [m, h, dom, mon, dow] = parts;
        const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        setSelectedTime(timeStr);

        if (dom === '*' && mon === '*') {
            if (dow === '*') {
                setCronType('daily');
            } else if (dow === '1-5') {
                setCronType('workdays');
            } else if (dow.includes(',') || (parseInt(dow) >= 0 && parseInt(dow) <= 6)) {
                setCronType('weekly');
                setSelectedWeekDays(dow.split(',').map(Number));
            } else {
                setCronType('custom');
            }
        } else {
            setCronType('custom');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [envRes, userRes, wbRes] = await Promise.all([
                    axios.get('/api/environments'),
                    axios.get('/api/users'),
                    axios.get('/api/workbooks')
                ]);
                setEnvironments(envRes.data);
                setUsers(userRes.data);
                if (Array.isArray(wbRes.data)) {
                    setWorkbooks(wbRes.data);
                }
                
                if (!isEdit && envRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, environment_id: envRes.data[0].id }));
                }

                if (isEdit && initialData) {
                    parseCron(initialData.cron_expression);
                }
            } catch (error) {
                console.error("Failed to load form data", error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, []);

    // Auto-update cron expression
    useEffect(() => {
        if (cronType === 'custom') return;

        const [hour, minute] = selectedTime.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) return;

        let newCron = '';
        if (cronType === 'daily') {
            newCron = `${minute} ${hour} * * *`;
        } else if (cronType === 'workdays') {
            newCron = `${minute} ${hour} * * 1-5`;
        } else if (cronType === 'weekly') {
            const days = selectedWeekDays.sort().join(',');
            newCron = `${minute} ${hour} * * ${days || '*'}`; 
        }
        
        setFormData(prev => ({ ...prev, cron_expression: newCron }));
    }, [cronType, selectedTime, selectedWeekDays]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put(`/api/tasks/${initialData.id}`, formData);
            } else {
                await axios.post('/api/tasks', formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save task", error);
            // Alert removed or kept based on preference. I'll keep it for errors only.
            alert(isEdit ? "更新任务失败" : "创建任务失败");
        } finally {
            setLoading(false);
        }
    };

    const toggleWeekDay = (day: number) => {
        setSelectedWeekDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleEnvChange = (envId: number) => {
        setFormData({
            ...formData, 
            environment_id: envId,
            workbook_names: [], // Reset selections when env changes
            target_user_ids: []
        });
    };

    const filteredUsers = users.filter(u => {
        const selectedEnv = environments.find(e => e.id === formData.environment_id);
        return selectedEnv ? u.env_name === selectedEnv.name : true;
    });

    const [workbookSearch, setWorkbookSearch] = useState('');

    const filteredWorkbooks = workbooks.filter(wb => 
        wb.name.toLowerCase().includes(workbookSearch.toLowerCase()) || 
        (wb.projectName || wb.projectId).toLowerCase().includes(workbookSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-xl font-semibold">{isEdit ? '编辑任务' : '新建任务'}</h2>
                    <button onClick={onClose}><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">任务名称</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        {isEdit && (
                            <div className="w-24">
                                <label className="block text-sm font-medium mb-1">状态</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, enabled: formData.enabled ? 0 : 1})}
                                    className={`w-full px-3 py-2 rounded text-sm font-medium transition ${
                                        formData.enabled 
                                            ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300' 
                                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}
                                >
                                    {formData.enabled ? '已启用' : '已禁用'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">环境</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                            value={formData.environment_id}
                            onChange={e => handleEnvChange(Number(e.target.value))}
                        >
                            {environments.map(env => (
                                <option key={env.id} value={env.id}>{env.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visual Cron Builder */}
                    <div className="border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                        <label className="block text-sm font-medium mb-3">推送时间设置</label>
                        
                        <div className="flex space-x-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">频率</label>
                                <select 
                                    className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                    value={cronType}
                                    onChange={e => setCronType(e.target.value as any)}
                                >
                                    <option value="daily">每天</option>
                                    <option value="workdays">工作日 (周一至周五)</option>
                                    <option value="weekly">每周</option>
                                    <option value="custom">自定义 Cron</option>
                                </select>
                            </div>
                            
                            {cronType !== 'custom' && (
                                <div className="w-1/3">
                                    <label className="block text-xs text-gray-500 mb-1">时间</label>
                                    <input 
                                        type="time" 
                                        className="w-full p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                        value={selectedTime}
                                        onChange={e => setSelectedTime(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {cronType === 'weekly' && (
                            <div className="mb-4">
                                <label className="block text-xs text-gray-500 mb-1">选择星期</label>
                                <div className="flex flex-wrap gap-2">
                                    {weekDayLabels.map((label, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => toggleWeekDay(idx)}
                                            className={`px-3 py-1 text-sm rounded border transition ${
                                                selectedWeekDays.includes(idx) 
                                                    ? 'bg-blue-600 text-white border-blue-600' 
                                                    : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 font-mono mt-2 flex items-center">
                            <span className="mr-2">Cron 表达式:</span>
                            {cronType === 'custom' ? (
                                <input 
                                    type="text" 
                                    required
                                    className="flex-1 p-1 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                    value={formData.cron_expression}
                                    onChange={e => setFormData({...formData, cron_expression: e.target.value})}
                                />
                            ) : (
                                <span className="bg-gray-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                                    {formData.cron_expression}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium">选择工作簿 (可多选)</label>
                            <div className="flex items-center space-x-4">
                                <input 
                                    type="text"
                                    placeholder="搜索工作簿..."
                                    className="text-xs p-1 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                    value={workbookSearch}
                                    onChange={e => setWorkbookSearch(e.target.value)}
                                />
                                {filteredWorkbooks.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="selectAllWorkbooks"
                                            checked={filteredWorkbooks.length > 0 && filteredWorkbooks.every(wb => formData.workbook_names.includes(wb.name))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const allNames = new Set([...formData.workbook_names, ...filteredWorkbooks.map(wb => wb.name)]);
                                                    setFormData(prev => ({ ...prev, workbook_names: Array.from(allNames) }));
                                                } else {
                                                    const filteredNames = filteredWorkbooks.map(wb => wb.name);
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        workbook_names: prev.workbook_names.filter(name => !filteredNames.includes(name)) 
                                                    }));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="selectAllWorkbooks" className="text-xs text-gray-500 cursor-pointer select-none">全选</label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="h-40 overflow-y-auto border rounded p-2 dark:bg-zinc-900 dark:border-zinc-700">
                            {filteredWorkbooks.length === 0 ? <div className="text-gray-500 text-sm">未找到匹配的工作簿</div> : 
                                filteredWorkbooks.map(wb => (
                                    <div key={wb.id} className="flex items-center space-x-2 mb-1">
                                        <input 
                                            type="checkbox"
                                            checked={formData.workbook_names.includes(wb.name)}
                                            onChange={e => {
                                                const newNames = e.target.checked 
                                                    ? [...formData.workbook_names, wb.name]
                                                    : formData.workbook_names.filter(n => n !== wb.name);
                                                setFormData({...formData, workbook_names: newNames});
                                            }}
                                        />
                                        <span className="text-sm">{wb.name} <span className="text-xs text-gray-500">({wb.projectName || wb.projectId})</span></span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium">接收用户 (当前环境)</label>
                            {filteredUsers.length > 0 && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="selectAllUsers"
                                        checked={filteredUsers.every(u => formData.target_user_ids.includes(u.id))}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData(prev => ({ ...prev, target_user_ids: filteredUsers.map(u => u.id) }));
                                            } else {
                                                setFormData(prev => ({ ...prev, target_user_ids: [] }));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="selectAllUsers" className="text-xs text-gray-500 cursor-pointer select-none">全选</label>
                                </div>
                            )}
                        </div>
                        <div className="h-40 overflow-y-auto border rounded p-2 dark:bg-zinc-900 dark:border-zinc-700">
                            {filteredUsers.length === 0 ? <div className="text-gray-500">该环境下无用户</div> : 
                                filteredUsers.map(u => (
                                    <div key={u.id} className="flex items-center space-x-2 mb-1">
                                        <input 
                                            type="checkbox"
                                            checked={formData.target_user_ids.includes(u.id)}
                                            onChange={e => {
                                                const newIds = e.target.checked 
                                                    ? [...formData.target_user_ids, u.id]
                                                    : formData.target_user_ids.filter(id => id !== u.id);
                                                setFormData({...formData, target_user_ids: newIds});
                                            }}
                                        />
                                        <span>{u.name} <span className="text-xs text-gray-500">({u.env_name})</span></span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800">取消</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
                        >
                            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            {isEdit ? '保存修改' : '创建任务'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};