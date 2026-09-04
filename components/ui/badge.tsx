import React from "react";

export type StatusVariant = "green" | "yellow" | "red" | "neutral" | "primary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  icon?: string;
  className?: string;
}

export function StatusBadge({
  children,
  variant = "neutral",
  icon,
  className = "",
}: BadgeProps) {
  const variantStyles: Record<StatusVariant, { container: string; dot: string }> = {
    green: {
      container: "bg-status-green-bg text-[#137333] border-status-green-border",
      dot: "bg-status-green",
    },
    yellow: {
      container: "bg-status-yellow-bg text-[#B06000] border-status-yellow-border",
      dot: "bg-status-yellow",
    },
    red: {
      container: "bg-status-red-bg text-[#C5221F] border-status-red-border",
      dot: "bg-status-red",
    },
    neutral: {
      container: "bg-status-neutral-bg text-[#3C4043] border-status-neutral-border",
      dot: "bg-status-neutral",
    },
    primary: {
      container: "bg-primary-light text-primary border-[#AECBFA]",
      dot: "bg-primary",
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase ${style.container} ${className}`}
    >
      {icon ? (
        <span className="material-symbols-outlined text-xs leading-none">{icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      )}
      {children}
    </span>
  );
}
