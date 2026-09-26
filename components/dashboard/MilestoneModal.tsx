"use client";

// Full-screen "achievement unlocked" sequence (spec 2.2): fade to black,
// trophy-style reveal, share card. The avatar's own leveling-up animation is
// already playing underneath — it's driven by moodState from the server,
// which is "leveling-up" for the same snapshot that has triggeredMilestone.
import { AnimatePresence, motion } from "framer-motion";
import { ShareCard } from "./ShareCard";

export interface MilestoneModalProps {
  milestone: { title: string; streakDays: number; moodState: string } | null;
  onClose: () => void;
}

export function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xs uppercase tracking-[0.5em] text-amber-500"
            >
              Milestone Unlocked
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-4xl font-bold uppercase tracking-wide text-zinc-50 sm:text-5xl"
            >
              {milestone.title}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <ShareCard
                title={milestone.title}
                streakDays={milestone.streakDays}
                moodState={milestone.moodState}
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={onClose}
              className="mt-8 border border-zinc-700 px-6 py-2 text-xs uppercase tracking-widest text-zinc-400 hover:border-amber-500/50 hover:text-amber-400"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
