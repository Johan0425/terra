import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google({
      // Auth.js v5 auto-detects AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET by default —
      // this app's env vars (and the README/.env.example) use the
      // GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET names instead, so they must be
      // passed explicitly or the provider silently gets an undefined
      // clientId (surfaces as Google's own "invalid_client" error page).
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
