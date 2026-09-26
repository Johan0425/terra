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
          // Phase 1: identity only. Phase 4 (Google Fit sync) extends this to:
          // "openid email profile " +
          // "https://www.googleapis.com/auth/fitness.activity.read " +
          // "https://www.googleapis.com/auth/fitness.sleep.read " +
          // "https://www.googleapis.com/auth/fitness.heart_rate.read"
          scope: "openid email profile",
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
