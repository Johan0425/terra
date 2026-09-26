import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm border border-amber-500/30 bg-zinc-950/80 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
          Terra
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          Your avatar is waiting to evolve.
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Sign in to sync your training, sleep, and activity into a living
          reflection of your progress.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full border border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm font-medium uppercase tracking-widest text-amber-400 transition hover:bg-amber-500/20"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
