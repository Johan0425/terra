"use client";

// next/dynamic with ssr:false must live in a Client Component boundary — the
// dashboard page itself is a Server Component (it awaits auth()), so the lazy
// import is isolated here.
import { useState } from "react";
import dynamic from "next/dynamic";
import type { MoodState } from "@/lib/types";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-amber-500/60" />
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Loading avatar…
        </p>
      </div>
    </div>
  ),
});

// TODO: Johan — Phase 4 replaces this hardcoded seed state with real output
// from lib/avatarEngine.ts (computed from Google Fit / manual-log metrics).
// This switcher exists purely to QA the Phase 3 animation transitions.
const DEMO_STATES: { label: string; moodState: MoodState; energyLevel: number }[] = [
  { label: "Fatigued", moodState: "fatigued", energyLevel: 18 },
  { label: "Neutral", moodState: "neutral", energyLevel: 45 },
  { label: "Energized", moodState: "energized", energyLevel: 82 },
  { label: "Leveling Up", moodState: "leveling-up", energyLevel: 100 },
];

export default function AvatarSection() {
  const [demoIndex, setDemoIndex] = useState(1); // start at "Neutral"
  const active = DEMO_STATES[demoIndex];

  return (
    <div>
      <div className="h-[60vh] w-full border border-amber-500/20 sm:h-[70vh]">
        <AvatarCanvas
          moodState={active.moodState}
          energyLevel={active.energyLevel}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_STATES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setDemoIndex(i)}
            className={`border px-3 py-1.5 text-xs uppercase tracking-widest transition ${
              i === demoIndex
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
