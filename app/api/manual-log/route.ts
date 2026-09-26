import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processDailyMetrics } from "@/lib/processDailyMetrics";

interface ManualLogBody {
  steps: number;
  sleepHours: number;
  workoutCompleted: boolean;
}

function isValidBody(body: unknown): body is ManualLogBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.steps === "number" &&
    b.steps >= 0 &&
    b.steps <= 200_000 &&
    typeof b.sleepHours === "number" &&
    b.sleepHours >= 0 &&
    b.sleepHours <= 24 &&
    typeof b.workoutCompleted === "boolean"
  );
}

// Fallback for users without Google Fit (notably iPhone — Apple Health has no
// public web API). The form only asks for steps/sleep/workout, so
// activeCalories is a rough estimate rather than a real measurement; that's
// an accepted tradeoff of the manual path, documented in the README.
const ESTIMATED_ACTIVE_CALORIES_IF_WORKOUT = 300;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await processDailyMetrics(session.user.id, {
      steps: Math.round(body.steps),
      sleepHours: body.sleepHours,
      workoutCompleted: body.workoutCompleted,
      activeCalories: body.workoutCompleted
        ? ESTIMATED_ACTIVE_CALORIES_IF_WORKOUT
        : 0,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[manual-log]", error);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
