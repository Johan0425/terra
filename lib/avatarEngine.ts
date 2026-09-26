import type { AvatarState, DailyMetrics, MoodState, UserGoal } from "./types";

// ---------------------------------------------------------------------------
// TERRA's avatar engine — the translation layer between raw fitness metrics
// and what the 3D avatar looks like. This is deliberately the ONLY place
// that logic lives: nothing in components/avatar/* knows what a "step" or
// "streak" is, and nothing here knows what a Three.js material is. That
// separation is what makes the fitness/coaching logic tunable (by Johan,
// a real coach) without anyone touching rendering code, and vice versa.
//
// TODO: Johan — the weights and thresholds below are a reasonable starting
// point, not a prescription. Adjust freely; nothing else in the codebase
// needs to change when you do.
// ---------------------------------------------------------------------------

/** Daily targets used to normalize raw metrics into 0-100 scores. Tune to taste. */
export const TARGETS = {
  steps: 8000,
  activeCalories: 400,
  sleepHours: 8,
};

/** How much each score contributes to energyLevel, per goal. Must each sum to 1. */
const GOAL_WEIGHTS: Record<
  UserGoal,
  { activity: number; sleep: number; consistency: number }
> = {
  "fat-loss": { activity: 0.5, sleep: 0.2, consistency: 0.3 },
  "muscle-gain": { activity: 0.3, sleep: 0.3, consistency: 0.4 },
  endurance: { activity: 0.55, sleep: 0.25, consistency: 0.2 },
};

/** energyLevel thresholds that decide the baseline mood (before milestones override it). */
const MOOD_THRESHOLDS = { fatiguedBelow: 35, energizedAbove: 65 };

/** Consecutive-day streak thresholds for each strengthTier (visual "muscle tone" level). */
const STRENGTH_TIER_STREAK: [minStreak: number, tier: 1 | 2 | 3 | 4 | 5][] = [
  [30, 5],
  [14, 4],
  [7, 3],
  [3, 2],
  [0, 1],
];

/** Streak lengths that unlock a milestone banner. */
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export const AURA_COLORS: Record<MoodState, string> = {
  fatigued: "#8a5a3c", // dull rust
  neutral: "#7c8a9a", // grey-blue
  energized: "#d4af37", // gold — brand accent
  "leveling-up": "#ffe066", // bright gold flash
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** 0-100 score for today's steps + active calories against TARGETS, averaged. */
function activityScore(metrics: DailyMetrics): number {
  const stepsScore = clamp((metrics.steps / TARGETS.steps) * 100);
  const caloriesScore = clamp(
    (metrics.activeCalories / TARGETS.activeCalories) * 100,
  );
  return (stepsScore + caloriesScore) / 2;
}

/** 0-100 score for sleep, using the trailing week if available (sleep debt matters more than one night). */
function sleepScore(today: DailyMetrics, last7Days: DailyMetrics[]): number {
  const window = last7Days.length > 0 ? last7Days : [today];
  const avgSleep =
    window.reduce((sum, d) => sum + d.sleepHours, 0) / window.length;
  return clamp((avgSleep / TARGETS.sleepHours) * 100);
}

/** 0-100 score for how many of the last 7 days had a completed workout. */
function consistencyScore(last7Days: DailyMetrics[]): number {
  if (last7Days.length === 0) return 0;
  const completed = last7Days.filter((d) => d.workoutCompleted).length;
  return (completed / last7Days.length) * 100;
}

function strengthTierFor(streakDays: number): 1 | 2 | 3 | 4 | 5 {
  const match = STRENGTH_TIER_STREAK.find(([min]) => streakDays >= min);
  return match?.[1] ?? 1;
}

function moodFor(energyLevel: number): MoodState {
  if (energyLevel < MOOD_THRESHOLDS.fatiguedBelow) return "fatigued";
  if (energyLevel > MOOD_THRESHOLDS.energizedAbove) return "energized";
  return "neutral";
}

/**
 * A streak milestone is "triggered" the day it's first reached — i.e. today's
 * streak hits a milestone value that yesterday's didn't. Passing
 * `previousStreakDays` (the streak as of the last snapshot) avoids
 * re-triggering the same milestone every day the streak continues.
 */
function checkMilestone(
  streakDays: number,
  previousStreakDays: number | undefined,
): string | undefined {
  if (previousStreakDays === streakDays) return undefined;
  const hit = STREAK_MILESTONES.find((m) => streakDays === m);
  return hit ? `${hit}-Day Streak Unlocked` : undefined;
}

export function calculateAvatarState(
  todayMetrics: DailyMetrics,
  last7Days: DailyMetrics[],
  userGoal: UserGoal,
  previousStreakDays?: number,
): AvatarState {
  const weights = GOAL_WEIGHTS[userGoal];

  const energyLevel = Math.round(
    clamp(
      activityScore(todayMetrics) * weights.activity +
        sleepScore(todayMetrics, last7Days) * weights.sleep +
        consistencyScore(last7Days) * weights.consistency,
    ),
  );

  const strengthTier = strengthTierFor(todayMetrics.streakDays);
  const triggeredMilestone = checkMilestone(
    todayMetrics.streakDays,
    previousStreakDays,
  );

  // A freshly-unlocked milestone always shows the leveling-up state/aura for
  // today, regardless of where energyLevel landed — it's a celebration, not
  // a score.
  const moodState: MoodState = triggeredMilestone
    ? "leveling-up"
    : moodFor(energyLevel);

  return {
    energyLevel,
    strengthTier,
    moodState,
    auraColor: AURA_COLORS[moodState],
    triggeredMilestone,
  };
}
