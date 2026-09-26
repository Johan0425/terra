"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { GlitchButton } from "@/components/ui/GlitchButton";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-10 w-10 animate-pulse rounded-full border-2 border-amber-500/60" />
    </div>
  ),
});

// Demo state for the logged-out hero — energized, to make a strong first
// impression. Not tied to any real user; see lib/avatarEngine.ts for how
// this is computed once someone's actually signed in.
const DEMO_ENERGIZED = { moodState: "energized" as const, energyLevel: 82 };

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <AvatarCanvas {...DEMO_ENERGIZED} />
      </div>

      {/* Gradient scrim so the headline stays legible over the 3D scene without hiding it. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-6 pb-20 text-center sm:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.4em] text-amber-500/80"
        >
          Terra
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 max-w-2xl text-4xl font-semibold text-zinc-50 sm:text-6xl"
        >
          Watch your progress come alive.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-xl text-zinc-400"
        >
          A living avatar that mirrors your real training, sleep, and
          consistency — not another flat dashboard.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <GlitchButton href="/login">Start your transformation</GlitchButton>
        </motion.div>
      </div>
    </section>
  );
}
