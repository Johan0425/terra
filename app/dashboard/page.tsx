import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AvatarSection from "@/components/dashboard/AvatarSection";
import { StatBar } from "@/components/dashboard/StatBar";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { ManualLogForm } from "@/components/dashboard/ManualLogForm";
import { HistoryTimeline } from "@/components/dashboard/HistoryTimeline";
import { TARGETS } from "@/lib/avatarEngine";
import { getHistory, getSnapshot, getUser, todayISO } from "@/lib/db/queries";
import type { AvatarState, DailyMetrics } from "@/lib/types";

const EMPTY_METRICS: DailyMetrics = {
  steps: 0,
  activeCalories: 0,
  sleepHours: 0,
  workoutCompleted: false,
  streakDays: 0,
};

const EMPTY_STATE: AvatarState = {
  energyLevel: 0,
  strengthTier: 1,
  moodState: "neutral",
  auraColor: "#7c8a9a",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [user, todaySnapshot, history] = await Promise.all([
    getUser(userId),
    getSnapshot(userId, todayISO()),
    getHistory(userId, 30),
  ]);

  const metrics = (todaySnapshot?.metrics as DailyMetrics) ?? EMPTY_METRICS;
  const avatarState =
    (todaySnapshot?.calculatedState as AvatarState) ?? EMPTY_STATE;
  const hasSyncedToday = Boolean(todaySnapshot);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-amber-500/20 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
              Terra // Dashboard
            </p>
            <h1 className="mt-1 text-xl font-semibold">
              Welcome back, {session.user.name ?? session.user.email}
            </h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="border border-zinc-700 px-3 py-2 text-xs uppercase tracking-widest text-zinc-400 hover:border-amber-500/50 hover:text-amber-400"
            >
              Sign out
            </button>
          </form>
        </header>

        {/* HUD: today's stats as RPG-style bars, not flat numbers */}
        <section className="mt-6 grid grid-cols-1 gap-4 border border-zinc-800 p-4 sm:grid-cols-2">
          <StatBar
            icon="👣"
            label="Steps"
            value={metrics.steps}
            target={TARGETS.steps}
            format="locale"
          />
          <StatBar
            icon="🔥"
            label="Active Calories"
            value={metrics.activeCalories}
            target={TARGETS.activeCalories}
          />
          <StatBar
            icon="🌙"
            label="Sleep"
            value={metrics.sleepHours}
            target={TARGETS.sleepHours}
            unit="h"
          />
          <StatBar
            icon="⚡"
            label="Energy Level"
            value={avatarState.energyLevel}
            target={100}
            unit="%"
          />
        </section>
        {!hasSyncedToday && (
          <p className="mt-2 text-xs text-zinc-600">
            No data logged for today yet — sync Google Fit or log manually
            below.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          <section>
            <AvatarSection
              moodState={avatarState.moodState}
              energyLevel={avatarState.energyLevel}
            />

            <div className="mt-4 flex flex-col items-center gap-3">
              <SyncButton />
              <ManualLogForm />
            </div>
          </section>

          <aside>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
              30-Day Timeline
            </p>
            <div className="mt-3">
              <HistoryTimeline
                days={history.map((h) => ({
                  date: h.date,
                  metrics: h.metrics as DailyMetrics,
                  calculatedState: h.calculatedState as AvatarState,
                }))}
              />
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex justify-between text-xs text-zinc-600">
          <span>Current streak: {user?.currentStreak ?? 0} days</span>
          <span>Longest streak: {user?.longestStreak ?? 0} days</span>
        </footer>
      </div>
    </main>
  );
}
