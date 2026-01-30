"use client";

import { motion } from "framer-motion";

interface CareStreakProps {
  streak: number;
}

const MILESTONES = [3, 7, 14, 30, 60, 100];

function getNextMilestone(streak: number): number {
  return MILESTONES.find((m) => m > streak) ?? streak + 10;
}

function getMotivationText(streak: number): string {
  if (streak === 0) return "Starte heute deine Pflege-Serie!";
  if (streak < 3) return "Guter Start! Bleib dran!";
  if (streak < 7) return "Super Fortschritt!";
  if (streak < 14) return "Eine Woche geschafft! Weiter so!";
  if (streak < 30) return "Du bist ein Pflanzenheld!";
  if (streak < 60) return "Unglaubliche Serie!";
  return "Legendärer Pflanzenflüsterer!";
}

export function CareStreak({ streak }: CareStreakProps) {
  const nextMilestone = getNextMilestone(streak);
  const progress = nextMilestone > 0 ? Math.min(streak / nextMilestone, 1) : 0;

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.span>
        <div>
          <p className="font-semibold text-lg leading-tight">
            {streak} {streak === 1 ? "Tag" : "Tage"} Pflege-Streak
          </p>
          <p className="text-sm text-muted-foreground">
            {getMotivationText(streak)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Fortschritt</span>
          <span>Nächstes Ziel: {nextMilestone} Tage</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
