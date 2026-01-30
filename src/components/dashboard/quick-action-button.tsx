"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  confirmLabel?: string;
  onAction: () => Promise<void>;
  variant?: "water" | "fertilize";
}

type ButtonState = "idle" | "confirm" | "loading" | "success";

export function QuickActionButton({
  icon,
  label,
  confirmLabel,
  onAction,
  variant = "water",
}: QuickActionButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  const resetTimer = useCallback(() => {
    const timeout = setTimeout(() => setState("idle"), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (state === "confirm") {
      return resetTimer();
    }
    if (state === "success") {
      const timeout = setTimeout(() => setState("idle"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [state, resetTimer]);

  async function handleClick() {
    if (state === "loading") return;

    if (state === "idle") {
      setState("confirm");
      return;
    }

    if (state === "confirm") {
      setState("loading");
      try {
        await onAction();
        setState("success");
      } catch {
        setState("idle");
      }
    }
  }

  const variantClasses =
    variant === "water"
      ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
      : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900";

  const confirmClasses =
    variant === "water"
      ? "bg-blue-500 text-white dark:bg-blue-600"
      : "bg-green-500 text-white dark:bg-green-600";

  const successClasses = "bg-emerald-500 text-white dark:bg-emerald-600";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={state === "loading"}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        state === "idle" && variantClasses,
        state === "confirm" && confirmClasses,
        state === "loading" && variantClasses,
        state === "success" && successClasses,
        state === "loading" && "opacity-70 cursor-wait"
      )}
    >
      <AnimatePresence mode="wait">
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </motion.span>
        ) : state === "success" ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
      <span>
        {state === "confirm"
          ? confirmLabel || "Bestätigen"
          : state === "success"
            ? "Erledigt!"
            : label}
      </span>
    </motion.button>
  );
}
