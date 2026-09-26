// Seeds 30 days of realistic demo data — mixed early days, a strong 14-day
// streak (crossing the 3/7/14-day milestones), a rest day, then a shorter
// closing streak — so the dashboard/history/landing avatar all have
// something to show without connecting real Google Fit data first. Safe to
// re-run: it wipes the demo user's prior snapshots/milestones each time.
//
// Usage: npm run db:seed

import { eq } from "drizzle-orm";
import { db } from "../lib/db/client";
import { dailySnapshots, milestones, users } from "../lib/db/schema";
import { processDailyMetrics } from "../lib/processDailyMetrics";
import { isoDateDaysAgo, getUser } from "../lib/db/queries";
import type { DailyMetrics } from "../lib/types";

const DEMO_USER_ID = "demo-user-terra";
const DEMO_EMAIL = "demo@terra.app";

// true = trained that day. Index 0 = 29 days ago ... index 29 = today.
const WORKOUT_PATTERN: boolean[] = [
  // days 0-3: mixed, not yet a streak
  true, false, true, false,
  // day 4: rest before the real streak starts
  false,
  // days 5-18: a strong 14-day streak (crosses 3/7/14-day milestones)
  true, true, true, true, true, true, true,
  true, true, true, true, true, true, true,
  // day 19: rest day — streak resets
  false,
  // days 20-23: mixed
  true, true, false, true,
  // days 24-29: a shorter closing streak (crosses the 3-day milestone again)
  true, true, true, true, true, true,
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function metricsForDay(workoutCompleted: boolean): Omit<DailyMetrics, "streakDays"> {
  if (workoutCompleted) {
    return {
      steps: Math.round(randomBetween(7000, 11500)),
      activeCalories: Math.round(randomBetween(350, 560)),
      sleepHours: Math.round(randomBetween(6.5, 8.5) * 10) / 10,
      workoutCompleted: true,
    };
  }
  return {
    steps: Math.round(randomBetween(1800, 5200)),
    activeCalories: Math.round(randomBetween(40, 160)),
    sleepHours: Math.round(randomBetween(5, 7.5) * 10) / 10,
    workoutCompleted: false,
  };
}

async function main() {
  console.log(`Seeding demo user ${DEMO_EMAIL}...`);

  await db
    .insert(users)
    .values({
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: "Terra Demo",
      goal: "fat-loss",
      currentStreak: 0,
      longestStreak: 0,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { currentStreak: 0, longestStreak: 0, goal: "fat-loss" },
    });

  // Idempotent re-seed: clear this user's prior snapshots/milestones.
  await db.delete(dailySnapshots).where(eq(dailySnapshots.userId, DEMO_USER_ID));
  await db.delete(milestones).where(eq(milestones.userId, DEMO_USER_ID));

  const today = new Date();
  let milestoneCount = 0;

  for (let i = 0; i < WORKOUT_PATTERN.length; i++) {
    const daysAgo = WORKOUT_PATTERN.length - 1 - i;
    const date = isoDateDaysAgo(daysAgo, today);
    const partial = metricsForDay(WORKOUT_PATTERN[i]);

    const { metrics, avatarState } = await processDailyMetrics(
      DEMO_USER_ID,
      partial,
      date,
    );

    const flag = avatarState.triggeredMilestone ? " 🏆" : "";
    if (avatarState.triggeredMilestone) milestoneCount++;
    console.log(
      `  ${date}  streak=${metrics.streakDays.toString().padStart(2)}  ` +
        `energy=${avatarState.energyLevel.toString().padStart(3)}%  ` +
        `mood=${avatarState.moodState}${flag}`,
    );
  }

  const finalUser = await getUser(DEMO_USER_ID);
  console.log(
    `\nDone. ${milestoneCount} milestone(s) unlocked. ` +
      `Current streak: ${finalUser?.currentStreak}, longest: ${finalUser?.longestStreak}.`,
  );
  console.log(
    `\nTo view this in the dashboard, sign in as ${DEMO_EMAIL} — or temporarily ` +
      `point app/dashboard/page.tsx at "${DEMO_USER_ID}" for a demo/portfolio recording.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
