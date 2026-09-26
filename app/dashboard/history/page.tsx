import { auth } from "@/auth";
import { redirect } from "next/navigation";

// TODO: Johan — Phase 4 replaces this with <HistoryTimeline /> reading
// dailySnapshots for the last 30 days.
export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
        Terra // History
      </p>
      <h1 className="mt-2 text-xl font-semibold">30-Day Timeline</h1>
      <p className="mt-4 text-sm text-zinc-500">
        // TODO: Johan — populated in Phase 4.
      </p>
    </main>
  );
}
