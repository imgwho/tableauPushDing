import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Task } from './types';
import { TaskForm } from './components/TaskForm';
import { TaskDetail } from './components/TaskDetail';
import { UserManager } from './components/UserManager';
import { Trash2, Play, Plus, Clock, Users, FileBarChart, Loader2, Settings, Eye } from 'lucide-react';
import { formatCron } from './utils/cronHelper';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [triggering, setTriggering] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此任务吗？")) return;
    try {
      await axios.delete(`/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleTrigger = async (id: number) => {
    setTriggering(id);
    try {
      await axios.post(`/api/tasks/${id}/trigger`);
      alert("任务触发成功");
    } catch (error) {
      console.error("Trigger failed", error);
      alert("触发失败");
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tableau Push Ding</h1>
            <p className="text-zinc-500 mt-2">管理自动截图任务</p>
          </div>
          <div className="flex space-x-3">
            <button 
                onClick={() => setShowUserManager(true)}
                className="flex items-center px-4 py-2 bg-zinc-200 text-zinc-800 rounded-lg hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 transition"
            >
                <Users className="mr-2 h-5 w-5" />
                用户管理
            </button>
            <button 
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                <Plus className="mr-2 h-5 w-5" />
                新建任务
            </button>
          </div>
        </header>

        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700">
            <p className="text-zinc-500">暂无任务，请创建新任务。</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 text-xs font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {task.env_name}
                    </span>
                    <h3 className="text-xl font-semibold">{task.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span title={task.cron_expression}>{formatCron(task.cron_expression)}</span>
                    </div>
                    <div className="flex items-center">
                      <FileBarChart className="h-4 w-4 mr-1" />
                      <span title={task.workbook_names}>
                        {(() => {
                            try {
                                const names = JSON.parse(task.workbook_names);
                                return Array.isArray(names) ? `${names.length} 个工作簿` : task.workbook_names;
                            } catch { return task.workbook_names; }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {(() => {
                            try {
                                const users = JSON.parse(task.target_user_ids);
                                return Array.isArray(users) ? `${users.length} 个用户` : '...';
                            } catch { return '...'; }
                        })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                   <button 
                      onClick={() => handleTrigger(task.id)}
                      disabled={triggering === task.id}
                      className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                   >
                     {triggering === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                     <span className="ml-2">立即运行</span>
                   </button>
                   <button 
                      onClick={() => setSelectedTask(task)}
                      className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition"
                      title="查看详情"
                   >
                     <Eye className="h-5 w-5" />
                   </button>
                   <button 
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="删除任务"
                   >
                     <Trash2 className="h-5 w-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <TaskForm 
            onClose={() => setShowForm(false)} 
            onSuccess={fetchTasks} 
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
      </div>
    </div>
  )
}

export default App