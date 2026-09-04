import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-sm",
    secondary:
      "bg-transparent border border-border text-neutral-900 hover:bg-neutral-100 hover:border-outline focus:ring-neutral-400",
    danger:
      "bg-status-red hover:bg-[#A51D24] text-white focus:ring-status-red shadow-sm",
    success:
      "bg-status-green hover:bg-[#15673E] text-white focus:ring-status-green shadow-sm",
    ghost:
      "bg-transparent text-primary hover:bg-primary-light focus:ring-primary",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="material-symbols-outlined text-base leading-none">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
