import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Environment, CreateUserDTO } from '../types';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onClose, onSuccess }) => {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<CreateUserDTO>({
        name: '',
        dingtalk_userid: '',
        environment_id: 0
    });

    useEffect(() => {
        axios.get('/api/environments')
            .then(res => {
                setEnvironments(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, environment_id: res.data[0].id }));
                }
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/users', formData);
            if (res.data.error) {
                alert(res.data.error);
            } else {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Failed to create user", error);
            alert("创建用户失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 mt-4">
            <h3 className="font-semibold text-sm mb-2">添加新用户</h3>
            <div className="grid grid-cols-1 gap-3">
                <div>
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
                <div>
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
                    保存
                </button>
            </div>
        </form>
    );
};
