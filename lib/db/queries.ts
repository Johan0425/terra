// No `import "server-only"` guard here deliberately: scripts/seed.ts imports
// this module through processDailyMetrics.ts via plain tsx/Node (not Next's
// bundler), and that guard throws unconditionally outside Next's webpack
// alias. Only ever import this from Server Components, Route Handlers, or
// scripts — never from a "use client" file.
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./client";
import { accounts, dailySnapshots, milestones, users } from "./schema";
import type { AvatarState, DailyMetrics, UserGoal } from "@/lib/types";

export async function getUser(userId: string) {
  return db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function updateUserGoal(userId: string, goal: UserGoal) {
  await db.update(users).set({ goal }).where(eq(users.id, userId));
}

export async function updateUserStreaks(
  userId: string,
  currentStreak: number,
  longestStreak: number,
) {
  await db
    .update(users)
    .set({ currentStreak, longestStreak })
    .where(eq(users.id, userId));
}

/** ISO date (YYYY-MM-DD) for "today", in the server's local timezone. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDateDaysAgo(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function getSnapshot(userId: string, date: string) {
  return db.query.dailySnapshots.findFirst({
    where: and(
      eq(dailySnapshots.userId, userId),
      eq(dailySnapshots.date, date),
    ),
  });
}

/** Snapshots for the trailing N days, most recent first, NOT including `date` itself. */
export async function getTrailingSnapshots(
  userId: string,
  date: string,
  days: number,
) {
  const start = isoDateDaysAgo(days, new Date(date));
  return db.query.dailySnapshots.findMany({
    where: and(
      eq(dailySnapshots.userId, userId),
      gte(dailySnapshots.date, start),
      lte(dailySnapshots.date, isoDateDaysAgo(1, new Date(date))),
    ),
    orderBy: desc(dailySnapshots.date),
  });
}

export async function getHistory(userId: string, days: number) {
  const start = isoDateDaysAgo(days - 1);
  return db.query.dailySnapshots.findMany({
    where: and(
      eq(dailySnapshots.userId, userId),
      gte(dailySnapshots.date, start),
    ),
    orderBy: desc(dailySnapshots.date),
  });
}

export async function upsertSnapshot(
  userId: string,
  date: string,
  metrics: DailyMetrics,
  calculatedState: AvatarState,
) {
  await db
    .insert(dailySnapshots)
    .values({ userId, date, metrics, calculatedState })
    .onConflictDoUpdate({
      target: [dailySnapshots.userId, dailySnapshots.date],
      set: { metrics, calculatedState },
    });
}

/**
 * Consecutive-day streak ending today, counting backward through snapshot
 * history until the first day without a completed workout (or a gap).
 */
export async function computeCurrentStreak(
  userId: string,
  today: string,
  todayWorkoutCompleted: boolean,
): Promise<number> {
  if (!todayWorkoutCompleted) return 0;

  const lookbackDays = 120; // supports up to the 100-day milestone with margin
  const start = isoDateDaysAgo(lookbackDays, new Date(today));
  const history = await db.query.dailySnapshots.findMany({
    where: and(
      eq(dailySnapshots.userId, userId),
      gte(dailySnapshots.date, start),
      lte(dailySnapshots.date, isoDateDaysAgo(1, new Date(today))),
    ),
  });
  const byDate = new Map(history.map((h) => [h.date, h]));

  let streak = 1; // today itself
  const cursor = new Date(today);
  for (let i = 1; i <= lookbackDays; i++) {
    cursor.setDate(cursor.getDate() - 1);
    const dateStr = cursor.toISOString().slice(0, 10);
    const snap = byDate.get(dateStr);
    if (snap && (snap.metrics as DailyMetrics).workoutCompleted) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function createMilestone(
  userId: string,
  title: string,
  description: string,
) {
  const [row] = await db
    .insert(milestones)
    .values({ userId, title, description })
    .returning();
  return row;
}

export async function getMilestones(userId: string) {
  return db.query.milestones.findMany({
    where: eq(milestones.userId, userId),
    orderBy: desc(milestones.unlockedAt),
  });
}

/** The user's Google account row (holds the OAuth tokens needed for Fitness API calls). */
export async function getGoogleAccount(userId: string) {
  return db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "google")),
  });
}

export async function updateGoogleAccountToken(
  userId: string,
  accessToken: string,
  expiresAt: number,
) {
  await db
    .update(accounts)
    .set({ access_token: accessToken, expires_at: expiresAt })
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
}
