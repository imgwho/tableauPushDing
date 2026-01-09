import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`flex items-center p-4 rounded-lg shadow-lg border animate-slide-up ${
            toast.type === 'success' 
                ? 'bg-white dark:bg-zinc-800 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400' 
                : 'bg-white dark:bg-zinc-800 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
        }`}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <XCircle className="h-5 w-5 mr-3" />}
            <span className="text-sm font-medium mr-4">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="ml-auto opacity-50 hover:opacity-100">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};
