import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google({
      authorization: {
        params: {
          // access_type: offline + prompt: consent is what makes Google return
          // a refresh_token, which @auth/drizzle-adapter persists on `account`.
          access_type: "offline",
          prompt: "consent",
          // Fitness scopes power /api/sync/google-fit (Phase 4). Users who
          // signed in during Phase 1-3 (before this changed) won't have
          // these grants yet — they'll need to sign out and back in once.
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
          ].join(" "),
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
