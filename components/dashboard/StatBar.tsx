"use client";

// RPG-style stat bar: icon + label + animated horizontal fill, instead of a
// flat number — the HUD's core visual language (see spec section 2.1).
import { motion } from "framer-motion";

export interface StatBarProps {
  icon: string;
  label: string;
  value: number;
  target: number;
  unit?: string;
  /** "locale" adds thousands separators (steps); omit for a plain rounded number. */
  format?: "locale";
}

export function StatBar({
  icon,
  label,
  value,
  target,
  unit,
  format,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / target) * 100));
  const displayValue =
    format === "locale" ? Math.round(value).toLocaleString() : Math.round(value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg leading-none" aria-hidden>
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between text-xs uppercase tracking-widest text-zinc-400">
          <span>{label}</span>
          <span className="font-mono text-amber-400">
            {displayValue}
            {unit}
          </span>
        </div>
        <div className="mt-1 h-2 w-full skew-x-[-12deg] border border-zinc-700 bg-zinc-900">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
