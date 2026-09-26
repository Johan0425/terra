import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

// Phase 1: identity + shell only. The avatar canvas, HUD stat bars, and
// history timeline land in Phases 2-4 — see the project README for the phase plan.
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

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

        <section className="mt-10 border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
          // TODO: Johan — Phase 2 mounts the 3D AvatarCanvas here, Phase 4
          // wires the stat-bar HUD to real Google Fit / manual-log data.
        </section>
      </div>
    </main>
  );
}
