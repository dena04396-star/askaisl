import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-800 text-white shadow-sm hover:bg-neutral-700 active:bg-neutral-900 disabled:bg-neutral-950 disabled:text-neutral-500 font-medium",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800",
  danger:
    "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-xs font-medium",
  md: "h-9 rounded-xl px-4 text-sm font-semibold",
  lg: "h-11 rounded-xl px-6 text-sm font-bold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
