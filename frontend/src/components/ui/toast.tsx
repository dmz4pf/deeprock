"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-[rgba(111,207,151,0.1)]",
    borderColor: "border-[rgba(111,207,151,0.5)]",
    iconColor: "text-[#6FCF97]",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-[rgba(235,87,87,0.1)]",
    borderColor: "border-[rgba(235,87,87,0.5)]",
    iconColor: "text-[#EB5757]",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-[rgba(245,158,11,0.1)]",
    borderColor: "border-[rgba(245,158,11,0.5)]",
    iconColor: "text-[#F59E0B]",
  },
  info: {
    icon: Info,
    bgColor: "bg-[rgba(232,180,184,0.1)]",
    borderColor: "border-[rgba(232,180,184,0.5)]",
    iconColor: "text-[#E8B4B8]",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);

      setToasts((prev) => [...prev, { ...toast, id }]);

      // Auto-remove after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 lg:bottom-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5",
        "min-w-[300px] max-w-[400px]",
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#F0EBE0]">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-[#B8A99A] break-words">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#B8A99A] hover:text-[#F0EBE0] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
