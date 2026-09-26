import Link from "next/link";

// TODO: Johan — Phase 5 replaces this with the full landing page
// (3D hero in "energized" mode, 3-step explainer, testimonials, CTA copy).
export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
        Terra
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
        Watch your progress come alive.
      </h1>
      <p className="max-w-xl text-zinc-400">
        A living avatar that mirrors your real training, sleep, and
        consistency — not another flat dashboard.
      </p>
      <Link
        href="/login"
        className="border border-amber-500/60 bg-amber-500/10 px-6 py-3 text-sm font-medium uppercase tracking-widest text-amber-400 transition hover:bg-amber-500/20"
      >
        Start your transformation
      </Link>
    </main>
  );
}
