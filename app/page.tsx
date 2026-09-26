import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { GlitchButton } from "@/components/ui/GlitchButton";

const STEPS = [
  {
    n: "01",
    title: "Connect your data",
    body: "Sign in with Google Fit, or log your day manually in seconds — no wearable required.",
  },
  {
    n: "02",
    title: "Watch your avatar evolve",
    body: "Posture, energy aura, and animation shift in real time with your sleep, activity, and consistency.",
  },
  {
    n: "03",
    title: "Level up in real life",
    body: "Streaks unlock milestones — a full-screen power-up moment you can share, built from your actual progress.",
  },
];

// TODO: Johan — replace with real testimonials from you / your community once you have them.
const TESTIMONIALS = [
  {
    quote:
      "I stopped checking MyFitnessPal every day. I check Terra because I want to see my avatar.",
    name: "// TODO: Johan — real name",
    role: "Early user",
  },
  {
    quote:
      "The streak mechanic is the first fitness gimmick that's actually worked on me.",
    name: "// TODO: Johan — real name",
    role: "Early user",
  },
  {
    quote:
      "Feels like a character screen for my own body. Weirdly motivating.",
    name: "// TODO: Johan — real name",
    role: "Early user",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.4em] text-amber-500/80">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <section className="border-t border-amber-500/10 bg-black px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>How it works</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="border border-zinc-800 p-6 transition hover:border-amber-500/40"
              >
                <span className="font-mono text-3xl text-amber-500/40">
                  {step.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-amber-500/10 bg-black px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionLabel>From the community</SectionLabel>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={i}
                className="border border-zinc-800 p-6 text-sm text-zinc-400"
              >
                <p className="text-zinc-300">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-xs uppercase tracking-widest text-zinc-600">
                  {t.name} — {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-amber-500/10 bg-black px-6 py-24 text-center">
        <SectionLabel>Ready?</SectionLabel>
        <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold text-zinc-50 sm:text-4xl">
          Your avatar is waiting to evolve.
        </h2>
        <div className="mt-8">
          <GlitchButton href="/login">Start your transformation</GlitchButton>
        </div>
      </section>

      <footer className="border-t border-zinc-900 bg-black px-6 py-8 text-center text-xs text-zinc-600">
        <p>
          Terra —{" "}
          <Link href="/login" className="hover:text-amber-400">
            Sign in
          </Link>
        </p>
      </footer>
    </>
  );
}
