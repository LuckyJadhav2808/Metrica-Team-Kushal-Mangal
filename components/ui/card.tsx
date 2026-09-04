import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-card rounded-lg border border-border p-5 shadow-card transition-all ${
        onClick ? "cursor-pointer hover:border-outline hover:shadow-subtle" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between pb-4 mb-4 border-b border-border ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-neutral-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-600 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
