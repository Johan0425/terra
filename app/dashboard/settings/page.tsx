import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser, updateUserGoal } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import type { UserGoal } from "@/lib/types";

const GOALS: { value: UserGoal; label: string; blurb: string }[] = [
  {
    value: "fat-loss",
    label: "Fat Loss",
    blurb: "Weighs activity + consistency heaviest.",
  },
  {
    value: "muscle-gain",
    label: "Muscle Gain",
    blurb: "Weighs workout consistency + sleep heaviest.",
  },
  {
    value: "endurance",
    label: "Endurance",
    blurb: "Weighs steps + active calories heaviest.",
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await getUser(session.user.id);

  async function setGoal(formData: FormData) {
    "use server";
    const goal = formData.get("goal") as UserGoal;
    const s = await auth();
    if (!s?.user) return;
    await updateUserGoal(s.user.id, goal);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
          Terra // Settings
        </p>
        <h1 className="mt-2 text-xl font-semibold">Profile</h1>
        <dl className="mt-6 space-y-2 text-sm text-zinc-400">
          <div className="flex justify-between border-b border-zinc-800 py-2">
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-zinc-800 py-2">
            <dt>Current streak</dt>
            <dd>{user?.currentStreak ?? 0} days</dd>
          </div>
          <div className="flex justify-between border-b border-zinc-800 py-2">
            <dt>Longest streak</dt>
            <dd>{user?.longestStreak ?? 0} days</dd>
          </div>
        </dl>

        <h2 className="mt-8 text-xs uppercase tracking-[0.3em] text-amber-500/80">
          Current Goal
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Shifts how avatarEngine weighs activity, sleep, and consistency.
        </p>
        <form action={setGoal} className="mt-4 space-y-2">
          {GOALS.map((g) => (
            <label
              key={g.value}
              className={`flex cursor-pointer items-start gap-3 border p-3 text-sm transition ${
                user?.goal === g.value
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="goal"
                value={g.value}
                defaultChecked={user?.goal === g.value}
                className="mt-1"
              />
              <span>
                <span className="block text-zinc-100">{g.label}</span>
                <span className="block text-xs text-zinc-500">{g.blurb}</span>
              </span>
            </label>
          ))}
          <button
            type="submit"
            className="mt-2 border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-widest text-amber-400 hover:bg-amber-500/20"
          >
            Save Goal
          </button>
        </form>

        {/* TODO: Johan — Phase 5 adds the milestone/medal gallery here. */}
      </div>
    </main>
  );
}
