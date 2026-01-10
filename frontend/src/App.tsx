import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Task } from './types';
import { TaskForm } from './components/TaskForm';
import { TaskDetail } from './components/TaskDetail';
import { UserManager } from './components/UserManager';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginForm } from './components/LoginForm';
import { Trash2, Play, Plus, Clock, Users, FileBarChart, Loader2, Eye, Pencil, Server, LogOut } from 'lucide-react';
import { formatCron } from './utils/cronHelper';
import { getEnvColor } from './utils/styleHelper';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  const [triggering, setTriggering] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
      const token = localStorage.getItem('auth_token');
      if (token) {
          setIsAuthenticated(true);
      }
      setAuthChecking(false);
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
  };

  const addToast = (type: 'success' | 'error', message: string) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      addToast('error', "获取任务列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchTasks();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/tasks/${id}`);
      fetchTasks();
      addToast('success', "任务删除成功");
    } catch (error) {
      console.error("Delete failed", error);
      addToast('error', "删除失败");
    } finally {
        setConfirmDeleteId(null);
    }
  };

  const handleTrigger = async (id: number) => {
    setTriggering(id);
    try {
      await axios.post(`/api/tasks/${id}/trigger`);
      addToast('success', "任务触发成功");
    } catch (error) {
      console.error("Trigger failed", error);
      addToast('error', "触发失败");
    } finally {
      setTriggering(null);
    }
  };

  if (authChecking) return null; // Or a spinner

  if (!isAuthenticated) {
      return <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Tableau Push Ding
            </h1>
            <p className="text-zinc-500 mt-2">管理自动截图任务</p>
          </div>
          <div className="flex space-x-3">
            <button 
                onClick={() => setShowUserManager(true)}
                className="flex items-center px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 transition shadow-sm"
            >
                <Users className="mr-2 h-5 w-5 text-zinc-500" />
                用户管理
            </button>
            <button 
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
            >
                <Plus className="mr-2 h-5 w-5" />
                新建任务
            </button>
            <button 
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title="退出登录"
            >
                <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-700 mb-4">
                <Plus className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">暂无任务</h3>
            <p className="text-zinc-500 mb-6">创建一个新任务开始自动推送报表。</p>
            <button 
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                创建任务
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map(task => {
                const envColors = getEnvColor(task.env_name);
                return (
                  <div key={task.id} className={`group bg-white dark:bg-zinc-800 rounded-xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition hover:shadow-md ${
                      !task.enabled ? 'opacity-60 border-dashed border-zinc-300 dark:border-zinc-600 grayscale-[0.5]' : 'border-zinc-200 dark:border-zinc-700'
                  }`}>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${envColors.bg} ${envColors.text} ${envColors.border} flex items-center gap-1.5`}>
                            <Server className="h-3 w-3" />
                            {task.env_name}
                        </span>
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                            {task.name}
                            {!task.enabled && <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 uppercase tracking-tight border border-zinc-200 dark:border-zinc-600">已禁用</span>}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center group/item" title={task.cron_expression}>
                          <Clock className="h-4 w-4 mr-2 text-zinc-400 group-hover/item:text-blue-500 transition-colors" />
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCron(task.cron_expression)}</span>
                        </div>
                        <div className="flex items-center group/item">
                          <FileBarChart className="h-4 w-4 mr-2 text-zinc-400 group-hover/item:text-indigo-500 transition-colors" />
                          <span title={task.workbook_names}>
                            {(() => {
                                try {
                                    const names = JSON.parse(task.workbook_names);
                                    return Array.isArray(names) ? `${names.length} 个工作簿` : task.workbook_names;
                                } catch { return task.workbook_names; }
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center group/item">
                          <Users className="h-4 w-4 mr-2 text-zinc-400 group-hover/item:text-emerald-500 transition-colors" />
                          {(() => {
                                try {
                                    const users = JSON.parse(task.target_user_ids);
                                    return Array.isArray(users) ? `${users.length} 个用户` : '...';
                                } catch { return '...'; }
                            })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-700/50">
                       <button 
                          onClick={() => handleTrigger(task.id)}
                          disabled={triggering === task.id || !task.enabled}
                          className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm border border-zinc-200 dark:border-zinc-600"
                       >
                         {triggering === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                         运行
                       </button>
                       <button 
                          onClick={() => setSelectedTask(task)}
                          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
                          title="查看详情"
                       >
                         <Eye className="h-5 w-5" />
                       </button>
                       <button 
                          onClick={() => setEditingTask(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="编辑任务"
                       >
                         <Pencil className="h-5 w-5" />
                       </button>
                       <button 
                          onClick={() => setConfirmDeleteId(task.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="删除任务"
                       >
                         <Trash2 className="h-5 w-5" />
                       </button>
                    </div>
                  </div>
                );
            })}
          </div>
        )}

        {confirmDeleteId && (
            <ConfirmModal 
                title="删除确认"
                message="确定要删除此任务吗？删除后将无法恢复。"
                confirmText="确认删除"
                isDanger={true}
                onConfirm={() => handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />
        )}

        {(showForm || editingTask) && (
          <TaskForm 
            initialData={editingTask || undefined}
            onClose={() => {
                setShowForm(false);
                setEditingTask(null);
            }} 
            onSuccess={() => {
                fetchTasks();
                addToast('success', editingTask ? "任务更新成功" : "任务创建成功");
            }} 
          />
        )}

        {selectedTask && (
            <TaskDetail 
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        )}

        {showUserManager && (
            <UserManager onClose={() => setShowUserManager(false)} />
        )}

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  )
}

export default App