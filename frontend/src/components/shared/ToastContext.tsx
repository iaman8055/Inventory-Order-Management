import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  const value = useMemo(() => ({
    showToast,
    success,
    error,
    warning,
    info
  }), [showToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full sm:w-auto">
        <AnimatePresence>
          {toasts.map(toast => {
            let Icon = CheckCircle;
            let bgClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
            let iconClass = "text-emerald-500";
            
            if (toast.type === "error") {
              Icon = XCircle;
              bgClass = "bg-rose-50 border-rose-200 text-rose-800";
              iconClass = "text-rose-500";
            } else if (toast.type === "warning") {
              Icon = AlertTriangle;
              bgClass = "bg-amber-50 border-amber-200 text-amber-800";
              iconClass = "text-amber-500";
            } else if (toast.type === "info") {
              Icon = Info;
              bgClass = "bg-sky-50 border-sky-200 text-sky-800";
              iconClass = "text-sky-500";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgClass} pointer-events-auto`}
                layout
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
                <span className="text-sm font-medium pr-6">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 rounded-lg p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
