import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HistoryTimeline } from "@/components/dashboard/HistoryTimeline";
import { getHistory } from "@/lib/db/queries";
import type { AvatarState, DailyMetrics } from "@/lib/types";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const history = await getHistory(session.user.id, 30);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
          Terra // History
        </p>
        <h1 className="mt-2 text-xl font-semibold">30-Day Timeline</h1>
        <div className="mt-6">
          <HistoryTimeline
            days={history.map((h) => ({
              date: h.date,
              metrics: h.metrics as DailyMetrics,
              calculatedState: h.calculatedState as AvatarState,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
