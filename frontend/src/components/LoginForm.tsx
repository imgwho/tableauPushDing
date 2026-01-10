import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, Loader2 } from 'lucide-react';

interface LoginFormProps {
    onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/login', { username, password });
            if (res.data.success) {
                // Save simple auth state
                localStorage.setItem('auth_token', 'logged_in');
                onLoginSuccess();
            } else {
                setError(res.data.error || '登录失败');
            }
        } catch (err) {
            console.error(err);
            setError('连接服务器失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-700 animate-scale-in">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Tableau Push Ding
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm">请输入管理员账号登录</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">用户名</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="admin"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">密码</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex justify-center items-center shadow-lg shadow-blue-600/20"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : '登 录'}
                    </button>
                </form>
            </div>
        </div>
    );
};
