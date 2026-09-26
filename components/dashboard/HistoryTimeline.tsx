"use client";

// Vertical 30-day timeline: one node per day, colored by that day's mood.
// Hovering a node shows a mini "snapshot" tooltip (spec section 2.1).
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AURA_COLORS } from "@/lib/avatarEngine";
import type { AvatarState, DailyMetrics } from "@/lib/types";

export interface HistoryDay {
  date: string;
  metrics: DailyMetrics;
  calculatedState: AvatarState;
}

export interface HistoryTimelineProps {
  days: HistoryDay[];
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function HistoryTimeline({ days }: HistoryTimelineProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (days.length === 0) {
    return (
      <p className="text-xs text-zinc-600">
        No history yet — sync or log today to start your timeline.
      </p>
    );
  }

  return (
    <div className="relative pl-3">
      <div className="absolute top-0 bottom-0 left-[7px] w-px bg-zinc-800" />
      <ul className="space-y-3">
        {days.map((day) => {
          const color = AURA_COLORS[day.calculatedState.moodState];
          return (
            <li
              key={day.date}
              className="relative flex items-center gap-3"
              onMouseEnter={() => setHovered(day.date)}
              onMouseLeave={() => setHovered((h) => (h === day.date ? null : h))}
            >
              <span
                className="relative z-10 h-3.5 w-3.5 shrink-0 rounded-full border border-black/40"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-zinc-500">
                {formatDate(day.date)}
              </span>

              <AnimatePresence>
                {hovered === day.date && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-8 z-20 w-48 border border-amber-500/30 bg-zinc-950 p-3 text-xs shadow-lg"
                  >
                    <p className="uppercase tracking-widest text-amber-500/80">
                      {formatDate(day.date)}
                    </p>
                    <p className="mt-1 capitalize text-zinc-300">
                      {day.calculatedState.moodState.replace("-", " ")} ·{" "}
                      {day.calculatedState.energyLevel}% energy
                    </p>
                    <p className="mt-1 text-zinc-500">
                      {day.metrics.steps.toLocaleString()} steps ·{" "}
                      {day.metrics.sleepHours}h sleep
                    </p>
                    <p className="text-zinc-500">
                      Streak: {day.metrics.streakDays} day
                      {day.metrics.streakDays === 1 ? "" : "s"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
