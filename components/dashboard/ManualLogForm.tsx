"use client";

// Fallback for users without Google Fit — notably iPhone users, since Apple
// Health has no public web API (only native HealthKit). Feeds the same
// avatarEngine as the Google Fit sync via /api/manual-log.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AvatarState, DailyMetrics } from "@/lib/types";

export interface ManualLogFormProps {
  onResult?: (result: { metrics: DailyMetrics; avatarState: AvatarState }) => void;
}

export function ManualLogForm({ onResult }: ManualLogFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState(5000);
  const [sleepHours, setSleepHours] = useState(7);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/manual-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, sleepHours, workoutCompleted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setStatus("idle");
      setOpen(false);
      onResult?.(data);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs uppercase tracking-widest text-zinc-500 underline underline-offset-4 hover:text-amber-400"
      >
        No Google Fit? Log today manually
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm border border-zinc-700 bg-zinc-950/80 p-4 text-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-amber-500/80">
          Manual Log — Today
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <label className="mt-3 block text-zinc-400">
        Steps (approx.)
        <input
          type="number"
          min={0}
          max={100000}
          value={steps}
          onChange={(e) => setSteps(Number(e.target.value))}
          className="mt-1 w-full border border-zinc-700 bg-black px-2 py-1.5 text-zinc-100"
        />
      </label>

      <label className="mt-3 block text-zinc-400">
        Sleep (hours)
        <input
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={sleepHours}
          onChange={(e) => setSleepHours(Number(e.target.value))}
          className="mt-1 w-full border border-zinc-700 bg-black px-2 py-1.5 text-zinc-100"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-zinc-400">
        <input
          type="checkbox"
          checked={workoutCompleted}
          onChange={(e) => setWorkoutCompleted(e.target.checked)}
          className="h-4 w-4 border-zinc-700 bg-black"
        />
        Trained today
      </label>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="mt-4 w-full border border-amber-500/60 bg-amber-500/10 py-2 text-xs uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save Log"}
      </button>
    </form>
  );
}
