"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { QuickActions } from "./quick-actions";
import { CheckInForm } from "./check-in-form";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function PlantActions({ plantId }: { plantId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Quick Actions with Check-in button */}
      <QuickActions plantId={plantId} onCheckIn={() => setOpen(true)} />

      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-[41] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
            aria-label="Neuer Check-in"
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Sheet with Check-in Form */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Neuer Check-in">
        <CheckInForm plantId={plantId} onSuccess={() => setOpen(false)} />
      </BottomSheet>
    </>
  );
}
