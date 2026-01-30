"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Leaf,
  Droplets,
  CalendarCheck,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./glass-card";
import { AnimatedCounter } from "./animated-counter";
import { CareStreak } from "./care-streak";
import { OverduePlantCard } from "./overdue-plant-card";

interface OverduePlant {
  id: string;
  name: string;
  location: string;
  resolvedPhotoUrl: string | null;
  wateringProgress: number;
  daysSinceWatered: number | null;
}

interface NeedsCheckInPlant {
  id: string;
  name: string;
  location: string;
  resolvedPhotoUrl: string | null;
}

export interface DashboardData {
  userName: string | null;
  plantCount: number;
  todayCheckIns: number;
  overdueCount: number;
  needsCheckInCount: number;
  streak: number;
  overduePlants: OverduePlant[];
  needsCheckInPlants: NeedsCheckInPlant[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const greeting = getGreeting();
  const displayName = data.userName || "Pflanzenfreund";

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white"
      >
        <h1 className="text-xl font-bold">
          {greeting}, {displayName}!
        </h1>
        <p className="mt-1 text-sm text-green-100">
          Du pflegst {data.plantCount}{" "}
          {data.plantCount === 1 ? "Pflanze" : "Pflanzen"}.
        </p>
        <Link href="/plants/new" className="mt-3 inline-block">
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 border"
          >
            <Plus className="mr-1 h-4 w-4" />
            Neue Pflanze
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <GlassCard>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
            </span>
            <span className="text-xs text-muted-foreground">Pflanzen</span>
          </div>
          <AnimatedCounter
            value={data.plantCount}
            className="text-2xl font-bold"
          />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="text-xs text-muted-foreground">Check-ins</span>
          </div>
          <AnimatedCounter
            value={data.todayCheckIns}
            className="text-2xl font-bold"
          />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Droplets className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </span>
            <span className="text-xs text-muted-foreground">Gießen fällig</span>
          </div>
          <AnimatedCounter
            value={data.overdueCount}
            className="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
          />
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </span>
            <span className="text-xs text-muted-foreground">Ohne Check-in</span>
          </div>
          <AnimatedCounter
            value={data.needsCheckInCount}
            className="text-2xl font-bold"
          />
        </GlassCard>
      </motion.div>

      {/* Care Streak */}
      <motion.div variants={itemVariants}>
        <CareStreak streak={data.streak} />
      </motion.div>

      {/* Overdue Plants */}
      {data.overduePlants.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-lg font-semibold">Pflege fällig</h2>
          <div className="space-y-2">
            {data.overduePlants.map((plant) => (
              <OverduePlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Needs Check-in */}
      {data.needsCheckInPlants.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-lg font-semibold">Heute noch kein Check-in</h2>
          <div className="space-y-2">
            {data.needsCheckInPlants.map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <div className="glass-card rounded-xl p-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    {plant.resolvedPhotoUrl ? (
                      <img
                        src={plant.resolvedPhotoUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Leaf className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{plant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plant.location}
                      </p>
                    </div>
                    <CalendarCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {data.plantCount === 0 && (
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-xl border border-dashed border-border"
        >
          <div className="flex flex-col items-center justify-center py-10">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className="h-12 w-12 text-muted-foreground/40" />
            </motion.div>
            <p className="mt-4 text-lg font-medium">Noch keine Pflanzen</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Füge deine erste Pflanze hinzu!
            </p>
            <Link href="/plants/new" className="mt-4">
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Pflanze anlegen
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
