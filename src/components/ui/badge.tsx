import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "destructive";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "border border-border text-foreground": variant === "outline",
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100": variant === "success",
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100": variant === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}
