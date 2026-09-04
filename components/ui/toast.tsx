"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, action?: Toast["action"]) => void;
    error: (title: string, message?: string, action?: Toast["action"]) => void;
    info: (title: string, message?: string, action?: Toast["action"]) => void;
    warning: (title: string, message?: string, action?: Toast["action"]) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string, action?: Toast["action"]) => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const newToast: Toast = { id, title, message, type, action };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastMethods = {
    success: (title: string, message?: string, action?: Toast["action"]) => addToast("success", title, message, action),
    error: (title: string, message?: string, action?: Toast["action"]) => addToast("error", title, message, action),
    info: (title: string, message?: string, action?: Toast["action"]) => addToast("info", title, message, action),
    warning: (title: string, message?: string, action?: Toast["action"]) => addToast("warning", title, message, action),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          const typeStyles = {
            success: {
              border: "border-secondary/40",
              bg: "bg-surface-container-lowest",
              iconBg: "bg-secondary/15 text-secondary",
              icon: "verified",
              bar: "bg-secondary",
            },
            error: {
              border: "border-error/40",
              bg: "bg-surface-container-lowest",
              iconBg: "bg-error/15 text-error",
              icon: "gavel",
              bar: "bg-error",
            },
            warning: {
              border: "border-tertiary-container/40",
              bg: "bg-surface-container-lowest",
              iconBg: "bg-tertiary-container/15 text-tertiary-container",
              icon: "warning",
              bar: "bg-tertiary-container",
            },
            info: {
              border: "border-primary/40",
              bg: "bg-surface-container-lowest",
              iconBg: "bg-primary/15 text-primary",
              icon: "info",
              bar: "bg-primary",
            },
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full rounded-xl border shadow-xl ${typeStyles.border} ${typeStyles.bg} p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 relative overflow-hidden`}
            >
              {/* Top Progress Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant/30 overflow-hidden">
                <div className={`h-full ${typeStyles.bar} animate-[shrink_4.5s_linear_forwards]`} />
              </div>

              <div className="flex items-start gap-3 mt-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeStyles.iconBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{typeStyles.icon}</span>
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-on-surface leading-tight">{t.title}</h4>
                  {t.message && <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{t.message}</p>}

                  {t.action && (
                    <button
                      onClick={t.action.onClick}
                      className="mt-2 text-[11px] font-bold text-primary hover:underline block"
                    >
                      {t.action.label} &rarr;
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="text-outline hover:text-on-surface p-1 rounded-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
