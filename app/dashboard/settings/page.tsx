import { auth } from "@/auth";
import { redirect } from "next/navigation";

// TODO: Johan — Phase 4/5 adds the goal selector (fat-loss/muscle-gain/endurance)
// and the milestone/medal gallery here.
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
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
          <dt>Goal</dt>
          <dd>// TODO: Johan — wire to users.goal</dd>
        </div>
      </dl>
    </main>
  );
}
