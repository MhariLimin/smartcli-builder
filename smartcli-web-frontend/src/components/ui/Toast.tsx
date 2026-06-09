import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import type { Toast as ToastType, ToastVariant } from '../../context/AppContext';
import { useToast } from '../../context/AppContext';

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
};

const borderMap: Record<ToastVariant, string> = {
  success: 'border-green-500/30',
  warning: 'border-amber-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { dismissToast } = useToast();
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 bg-navy-800 border rounded-xl shadow-xl',
        'animate-slide-up min-w-[280px] max-w-sm',
        borderMap[toast.variant]
      )}
      role="status"
      aria-live="polite"
    >
      {iconMap[toast.variant]}
      <p className="text-sm text-slate-200 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => dismissToast(toast.id)}
        className="text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
