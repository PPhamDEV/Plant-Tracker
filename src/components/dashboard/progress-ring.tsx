"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0.0 - 1.0+
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

function getProgressColor(progress: number): string {
  if (progress < 0.6) return "#3b82f6"; // blue
  if (progress < 0.85) return "#eab308"; // yellow
  return "#ef4444"; // red
}

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 3,
  children,
}: ProgressRingProps) {
  const clampedProgress = Math.min(progress, 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedProgress);
  const color = getProgressColor(progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
