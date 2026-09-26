"use client";

// Orchestrates the sync/manual-log actions and the milestone celebration:
// both actions report their result here, and if the engine flagged a
// triggeredMilestone, the full-screen MilestoneModal takes over. The avatar
// itself already reflects "leveling-up" once router.refresh() lands (moodState
// comes from the server), so this only owns the modal/share-card layer.
import { useState } from "react";
import { SyncButton } from "./SyncButton";
import { ManualLogForm } from "./ManualLogForm";
import { MilestoneModal } from "./MilestoneModal";
import type { AvatarState, DailyMetrics } from "@/lib/types";

export function DashboardActions() {
  const [milestone, setMilestone] = useState<{
    title: string;
    streakDays: number;
    moodState: string;
  } | null>(null);

  function handleResult(result: { metrics: DailyMetrics; avatarState: AvatarState }) {
    if (result.avatarState.triggeredMilestone) {
      setMilestone({
        title: result.avatarState.triggeredMilestone,
        streakDays: result.metrics.streakDays,
        moodState: result.avatarState.moodState,
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <SyncButton onResult={handleResult} />
      <ManualLogForm onResult={handleResult} />
      <MilestoneModal milestone={milestone} onClose={() => setMilestone(null)} />
    </div>
  );
}
