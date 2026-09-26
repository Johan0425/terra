// Shared domain types for TERRA. Kept separate from the Drizzle schema
// (lib/db/schema.ts) so business logic never has to import the DB layer.

export type UserGoal = "fat-loss" | "muscle-gain" | "endurance";

export type MoodState = "fatigued" | "neutral" | "energized" | "leveling-up";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  goal: UserGoal;
  currentStreak: number;
  longestStreak: number;
}

/** Raw metrics for a single day, either synced from Google Fit or entered manually. */
export interface DailyMetrics {
  steps: number;
  activeCalories: number;
  sleepHours: number;
  workoutCompleted: boolean;
  streakDays: number;
}

/** Output of the avatar engine — what the 3D scene actually renders. */
export interface AvatarState {
  energyLevel: number; // 0-100
  strengthTier: 1 | 2 | 3 | 4 | 5;
  moodState: MoodState;
  auraColor: string; // hex, e.g. "#d4af37"
  triggeredMilestone?: string; // e.g. "30-Day Streak Unlocked"
}

export interface DailySnapshot {
  id: string;
  userId: string;
  date: string; // ISO date, YYYY-MM-DD
  metrics: DailyMetrics;
  calculatedState: AvatarState;
}

export interface Milestone {
  id: string;
  userId: string;
  title: string;
  description: string;
  unlockedAt: Date;
  shareImageUrl?: string | null;
}
