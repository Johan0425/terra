import "server-only";
import { calculateAvatarState } from "@/lib/avatarEngine";
import {
  computeCurrentStreak,
  createMilestone,
  getTrailingSnapshots,
  getUser,
  todayISO,
  updateUserStreaks,
  upsertSnapshot,
} from "@/lib/db/queries";
import type { AvatarState, DailyMetrics } from "@/lib/types";

/**
 * Shared by /api/sync/google-fit and /api/manual-log: given today's raw
 * metrics (from whichever source), computes the streak, runs the avatar
 * engine, persists the snapshot, updates the user's streak record, and
 * writes a Milestone row if one was just unlocked.
 */
export async function processDailyMetrics(
  userId: string,
  partialMetrics: Omit<DailyMetrics, "streakDays">,
): Promise<{ metrics: DailyMetrics; avatarState: AvatarState }> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  const date = todayISO();
  const streakDays = await computeCurrentStreak(
    userId,
    date,
    partialMetrics.workoutCompleted,
  );
  const todayMetrics: DailyMetrics = { ...partialMetrics, streakDays };

  const last7 = await getTrailingSnapshots(userId, date, 7);
  const last7Metrics = last7.map((s) => s.metrics as DailyMetrics);

  const avatarState = calculateAvatarState(
    todayMetrics,
    last7Metrics,
    user.goal,
    user.currentStreak,
  );

  await upsertSnapshot(userId, date, todayMetrics, avatarState);

  const longestStreak = Math.max(user.longestStreak, streakDays);
  await updateUserStreaks(userId, streakDays, longestStreak);

  if (avatarState.triggeredMilestone) {
    await createMilestone(
      userId,
      avatarState.triggeredMilestone,
      `Reached a ${streakDays}-day streak.`,
    );
  }

  return { metrics: todayMetrics, avatarState };
}
