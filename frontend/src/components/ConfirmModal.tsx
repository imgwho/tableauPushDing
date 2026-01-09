import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "确认", 
    cancelText = "取消",
    isDanger = false
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-700">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {isDanger && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {title}
                    </h3>
                    <button onClick={onCancel} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
                </div>
                
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-sm ${
                            isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
