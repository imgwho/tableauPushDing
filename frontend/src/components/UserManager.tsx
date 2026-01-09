import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from '../types';
import { UserForm } from './UserForm';
import { X, UserPlus, Users, Search, Loader2 } from 'lucide-react';

interface UserManagerProps {
    onClose: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.dingtalk_userid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center space-x-2">
                        <Users className="h-6 w-6" />
                        <h2 className="text-xl font-semibold">用户管理</h2>
                    </div>
                    <button onClick={onClose}><X /></button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="搜索用户..."
                                className="w-full pl-8 pr-4 py-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {!showAddForm && (
                            <button 
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                <UserPlus className="mr-1.5 h-4 w-4" />
                                添加用户
                            </button>
                        )}
                    </div>

                    {showAddForm && (
                        <div className="mb-6">
                            <UserForm 
                                onClose={() => setShowAddForm(false)} 
                                onSuccess={() => {
                                    fetchUsers();
                                }} 
                            />
                        </div>
                    )}

                    <div className="border rounded dark:border-zinc-700 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-100 dark:bg-zinc-900/50">
                                <tr>
                                    <th className="p-3 font-medium">姓名</th>
                                    <th className="p-3 font-medium">DingTalk ID</th>
                                    <th className="p-3 font-medium">环境</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-700">
                                {loading ? (
                                    <tr><td colSpan={3} className="p-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={3} className="p-4 text-center text-gray-500">无用户</td></tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                            <td className="p-3">{user.name}</td>
                                            <td className="p-3 font-mono text-xs">{user.dingtalk_userid}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                    {user.env_name}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};