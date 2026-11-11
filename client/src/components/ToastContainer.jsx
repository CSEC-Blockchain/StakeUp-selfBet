import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useStakeUp } from '../lib/stakeupContext';

export function ToastContainer() {
  const { toasts } = useStakeUp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top duration-300 pointer-events-auto ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-700/80 text-red-200'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-700/80 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-600/80 text-emerald-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
