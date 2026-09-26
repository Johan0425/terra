"use client";

// Exportable "achievement unlocked" image for social sharing — the whole
// point being that a real milestone becomes something postable, connecting
// the product directly to content/marketing use.
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export interface ShareCardProps {
  title: string;
  streakDays: number;
  moodState: string;
}

export function ShareCard({ title, streakDays, moodState }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#000000",
      });
      const link = document.createElement("a");
      link.download = `terra-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="relative w-80 border border-amber-500/40 bg-black p-8 text-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(212,175,55,0.15), transparent 70%)",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500/70">
          Terra
        </p>
        <p className="mt-6 text-3xl font-bold uppercase tracking-wide text-amber-400">
          Milestone
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-100">{title}</p>
        <p className="mt-6 font-mono text-5xl text-zinc-50">{streakDays}</p>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          day streak
        </p>
        <p className="mt-6 text-[10px] uppercase tracking-widest text-zinc-600">
          {moodState.replace("-", " ")} · watch your progress come alive
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 disabled:opacity-60"
      >
        {downloading ? "Preparing…" : "Download Share Card"}
      </button>
    </div>
  );
}
