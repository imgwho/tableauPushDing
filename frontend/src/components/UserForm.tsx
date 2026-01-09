import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Environment, Filiale, CreateUserDTO, User } from '../types';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: User;
}

export const UserForm: React.FC<UserFormProps> = ({ onClose, onSuccess, initialData }) => {
    const isEdit = !!initialData;
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [filiales, setFiliales] = useState<Filiale[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<CreateUserDTO>({
        name: initialData?.name || '',
        dingtalk_userid: initialData?.dingtalk_userid || '',
        environment_id: initialData?.environment_id || 0,
        filiale_id: initialData?.filiale_id || null
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [envRes, filRes] = await Promise.all([
                    axios.get('/api/environments'),
                    axios.get('/api/filiales')
                ]);
                setEnvironments(envRes.data);
                setFiliales(filRes.data);
                
                if (!isEdit && envRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, environment_id: envRes.data[0].id }));
                }
            } catch (e) {
                console.error("Failed to load user form options", e);
            }
        };
        fetchData();
    }, [isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                const res = await axios.put(`/api/users/${initialData.id}`, formData);
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                    onSuccess();
                    onClose();
                }
            } else {
                const res = await axios.post('/api/users', formData);
                if (res.data.error) {
                    alert(res.data.error);
                } else {
                    onSuccess();
                    onClose();
                }
            }
        } catch (error) {
            console.error("Failed to save user", error);
            alert(isEdit ? "更新用户失败" : "创建用户失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 mt-4">
            <h3 className="font-semibold text-sm mb-2">{isEdit ? '编辑用户' : '添加新用户'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">姓名</label>
                    <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded text-sm dark:bg-zinc-900 dark:border-zinc-700"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="例如: 张三"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">钉钉 UserID</label>
                    <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded text-sm dark:bg-zinc-900 dark:border-zinc-700"
                        value={formData.dingtalk_userid}
                        onChange={e => setFormData({...formData, dingtalk_userid: e.target.value})}
                        placeholder="例如: manager123"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">环境</label>
                    <select 
                        className="w-full p-2 border rounded text-sm dark:bg-zinc-900 dark:border-zinc-700"
                        value={formData.environment_id}
                        onChange={e => setFormData({...formData, environment_id: Number(e.target.value)})}
                    >
                        {environments.map(env => (
                            <option key={env.id} value={env.id}>{env.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">所属分公司 (可选)</label>
                    <select 
                        className="w-full p-2 border rounded text-sm dark:bg-zinc-900 dark:border-zinc-700"
                        value={formData.filiale_id || ''}
                        onChange={e => setFormData({...formData, filiale_id: e.target.value ? Number(e.target.value) : null})}
                    >
                        <option value="">-- 总部/无限制 --</option>
                        {filiales.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-3 py-1.5 text-sm rounded border hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                    取消
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                    {loading && <Loader2 className="animate-spin mr-1 h-3 w-3" />}
                    {isEdit ? '保存修改' : '立即创建'}
                </button>
            </div>
        </form>
    );
};
