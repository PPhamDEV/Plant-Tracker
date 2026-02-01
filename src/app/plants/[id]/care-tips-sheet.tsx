"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Droplets,
  Sun,
  Thermometer,
  Layers,
  Bug,
  ChevronDown,
} from "lucide-react";
import type { CareTip } from "@/lib/care-tips";

interface CareTipsSheetProps {
  tips: CareTip[];
  plantName: string | null;
  isSpecific: boolean;
  source?: "db" | "perenual" | "static" | null;
}

const CATEGORY_CONFIG: Record<
  CareTip["category"],
  { icon: typeof Droplets; color: string; bg: string }
> = {
  water: { icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
  light: { icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
  temperature: {
    icon: Thermometer,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  substrate: { icon: Layers, color: "text-orange-500", bg: "bg-orange-500/10" },
  problems: { icon: Bug, color: "text-purple-500", bg: "bg-purple-500/10" },
};

export function CareTipsSheet({
  tips,
  plantName,
  isSpecific,
  source,
}: CareTipsSheetProps) {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function toggleTip(index: number) {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }

  return (
    <>
      {/* Trigger Card */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98] dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/40 dark:hover:border-emerald-700"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Pflege-Tipps
            </p>
            <p className="truncate text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {isSpecific
                ? `Spezifisch für ${plantName}`
                : "Allgemeine Zimmerpflanzen-Tipps"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-y-0.5" />
        </div>
      </button>

      {/* BottomSheet */}
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setExpandedIndex(null);
        }}
        title="Pflege-Tipps"
      >
        <div className="space-y-3">
          {/* Header badge */}
          {isSpecific ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Lightbulb className="h-3 w-3" />
              {plantName}
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">
              Keine artspezifischen Tipps verfügbar — hier sind allgemeine
              Pflegehinweise für Zimmerpflanzen.
            </p>
          )}

          {/* Tip cards */}
          {tips.map((tip, i) => {
            const config = CATEGORY_CONFIG[tip.category];
            const Icon = config.icon;
            const isExpanded = expandedIndex === i;

            return (
              <button
                key={tip.category}
                type="button"
                onClick={() => toggleTip(i)}
                className="w-full rounded-lg border border-border bg-card text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {tip.title}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-3 pb-3 text-sm leading-relaxed text-muted-foreground">
                        {tip.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}

          {/* Source indicator */}
          {source && (
            <p className="pt-1 text-center text-[10px] text-muted-foreground/60">
              {source === "perenual"
                ? "Quelle: Perenual Plant API"
                : source === "db"
                  ? "Aus der Datenbank"
                  : "Redaktionelle Pflege-Tipps"}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
