import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-surface-card rounded-lg shadow-modal border border-border overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border bg-surface-container-low">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-600 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 rounded hover:bg-neutral-200"
          >
            <span className="material-symbols-outlined text-xl leading-none">close</span>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
