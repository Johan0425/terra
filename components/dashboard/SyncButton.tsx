"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AvatarState, DailyMetrics } from "@/lib/types";

export interface SyncButtonProps {
  onResult?: (result: { metrics: DailyMetrics; avatarState: AvatarState }) => void;
}

export function SyncButton({ onResult }: SyncButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setStatus("syncing");
    setError(null);
    try {
      const res = await fetch("/api/sync/google-fit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Sync failed");
      }
      setStatus("idle");
      onResult?.(data);
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleSync}
        disabled={status === "syncing"}
        className="relative overflow-hidden border border-amber-500/60 bg-amber-500/10 px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-amber-400 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <AnimatePresence mode="wait">
          {status === "syncing" ? (
            <motion.span
              key="syncing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent"
              />
              Scanning…
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Sync Data
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
