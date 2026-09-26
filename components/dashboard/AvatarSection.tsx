"use client";

// next/dynamic with ssr:false must live in a Client Component boundary — the
// dashboard page itself is a Server Component (it awaits auth() + DB reads),
// so the lazy import is isolated here.
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

export interface AvatarSectionProps {
  moodState: MoodState;
  energyLevel: number;
  facePhotoUrl?: string;
}

export default function AvatarSection({
  moodState,
  energyLevel,
  facePhotoUrl,
}: AvatarSectionProps) {
  return (
    <div className="h-[60vh] w-full border border-amber-500/20 sm:h-[70vh]">
      <AvatarCanvas
        moodState={moodState}
        energyLevel={energyLevel}
        facePhotoUrl={facePhotoUrl}
      />
    </div>
  );
}
