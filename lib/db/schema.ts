import {
  integer,
  timestamp,
  pgTable,
  text,
  primaryKey,
  jsonb,
  date,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { DailyMetrics, AvatarState, UserGoal } from "@/lib/types";

// ---------------------------------------------------------------------------
// Auth.js (NextAuth v5) required tables — shape mandated by @auth/drizzle-adapter.
// Do not rename columns; the adapter reads/writes these exact names.
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  // TERRA-specific profile fields, appended to the standard Auth.js user.
  goal: text("goal").$type<UserGoal>().notNull().default("fat-loss"),
  currentStreak: integer("currentStreak").notNull().default(0),
  longestStreak: integer("longestStreak").notNull().default(0),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    // access_token / refresh_token / expires_at are how /app/api/sync/google-fit
    // authenticates against the Google Fit REST API on the user's behalf.
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

// ---------------------------------------------------------------------------
// TERRA app tables
// ---------------------------------------------------------------------------

/** One row per user per calendar day: raw metrics + the avatar state derived from them. */
export const dailySnapshots = pgTable(
  "daily_snapshot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    metrics: jsonb("metrics").$type<DailyMetrics>().notNull(),
    calculatedState: jsonb("calculatedState").$type<AvatarState>().notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (snapshot) => [
    uniqueIndex("daily_snapshot_user_date_idx").on(
      snapshot.userId,
      snapshot.date,
    ),
  ],
);

export const milestones = pgTable("milestone", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  unlockedAt: timestamp("unlockedAt", { mode: "date" }).notNull().defaultNow(),
  shareImageUrl: text("shareImageUrl"),
});
