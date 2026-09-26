import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AvatarSection from "@/components/dashboard/AvatarSection";

// Phase 2 adds the 3D avatar canvas. The HUD stat bars and history timeline
// land in Phase 4 — see the project README for the phase plan.
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

        <section className="mt-10">
          <AvatarSection />
        </section>

        <section className="mt-6 border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
          {/* TODO: Johan — Phase 3 wires the 4-state Animation State Machine.
              Phase 4 adds the HUD stat bars and history timeline here. */}
          HUD stat bars land in Phase 4.
        </section>
      </div>
    </main>
  );
}
