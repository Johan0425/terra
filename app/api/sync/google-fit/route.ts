import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchGoogleFitDaily } from "@/lib/googleFit/client";
import { processDailyMetrics } from "@/lib/processDailyMetrics";
import { todayISO } from "@/lib/db/queries";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const daily = await fetchGoogleFitDaily(session.user.id, todayISO());
    const result = await processDailyMetrics(session.user.id, daily);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sync/google-fit]", error);
    const message =
      error instanceof Error ? error.message : "Google Fit sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
